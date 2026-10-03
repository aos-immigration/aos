// @vitest-environment edge-runtime
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { decodeBase64, encodeBase64 } from "./sensitiveCrypto";

declare global {
  interface ImportMeta {
    glob(pattern: string | string[]): Record<string, () => Promise<unknown>>;
  }
}

const modules = import.meta.glob("./**/*.*s");

function key(byte: number) {
  return encodeBase64(new Uint8Array(32).fill(byte));
}

const basics = {
  givenName: "Ada",
  familyName: "Lovelace",
  dateOfBirth: { month: "12", day: "10", year: "1815" },
  citizenshipStatus: "us_citizen",
  relationship: "spouse",
};

beforeEach(() => {
  process.env.SENSITIVE_ID_KEY = key(7);
  process.env.SENSITIVE_ID_KEY_VERSION = "1";
  delete process.env.SENSITIVE_ID_KEY_PREVIOUS;
  delete process.env.SENSITIVE_ID_KEY_PREVIOUS_VERSION;
  process.env.PDF_FILL_SECRET = "fill-secret";
});

async function seeded() {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity({ subject: "user_alice" });
  const bob = t.withIdentity({ subject: "user_bob" });
  const applicationId = await alice.mutation(api.petitioner.getOrCreateApplication, {});
  await alice.mutation(api.petitioner.savePetitionerBasics, { applicationId, ...basics });
  return { t, alice, bob, applicationId };
}

describe("sensitive ids", () => {
  test("stores ciphertext and returns only the last four digits", async () => {
    const { t, alice, applicationId } = await seeded();
    const saved = await alice.mutation(api.sensitive.saveSensitiveIds, {
      applicationId,
      ssn: "123-45-6789",
      aNumber: "A123456789",
    });
    expect(saved).toEqual({ ssnLast4: "6789", aNumberLast4: "6789" });

    const visible = await alice.query(api.petitioner.getPetitionerBasics, { applicationId });
    expect(visible?.ssnLast4).toBe("6789");
    expect(visible?.aNumberLast4).toBe("6789");
    expect(visible).not.toHaveProperty("ssn");
    expect(visible).not.toHaveProperty("aNumber");
    expect(JSON.stringify(visible)).not.toContain("123-45-6789");
    expect(JSON.stringify(visible)).not.toContain("123456789");

    const stored = await t.run(async (ctx) => {
      return await ctx.db
        .query("petitionerBasics")
        .withIndex("by_application", (q) => q.eq("applicationId", applicationId))
        .first();
    });
    expect(stored?.ssn?.ciphertext).toBeTruthy();
    expect(stored?.ssn?.ciphertext).not.toContain("6789");
    expect(stored?.ssn?.keyVersion).toBe(1);
    expect(stored?.ssn?.last4).toBe("6789");
  });

  test("rejects another user's ids and a tampered ciphertext", async () => {
    const { t, alice, bob, applicationId } = await seeded();
    await alice.mutation(api.sensitive.saveSensitiveIds, {
      applicationId,
      ssn: "123-45-6789",
    });
    await expect(
      bob.mutation(api.sensitive.saveSensitiveIds, { applicationId, ssn: "111-22-3333" }),
    ).rejects.toThrow("Application not found");
    await expect(
      bob.query(internal.sensitive.loadForFill, { applicationId }),
    ).rejects.toThrow("Application not found");

    await t.run(async (ctx) => {
      const row = await ctx.db
        .query("petitionerBasics")
        .withIndex("by_application", (q) => q.eq("applicationId", applicationId))
        .first();
      if (!row?.ssn) throw new Error("missing");
      const bytes = decodeBase64(row.ssn.ciphertext);
      const first = bytes[0] ?? 0;
      bytes[0] = first ^ 0xff;
      await ctx.db.patch(row._id, {
        ssn: { ...row.ssn, ciphertext: encodeBase64(bytes) },
      });
    });
    await expect(
      alice.query(internal.sensitive.loadForFill, { applicationId }),
    ).rejects.toThrow("Sensitive ID could not be decrypted");
  });

  test("fails closed on an unknown key version and rotates with the previous key", async () => {
    const { t, alice, applicationId } = await seeded();
    await alice.mutation(api.sensitive.saveSensitiveIds, {
      applicationId,
      ssn: "123-45-6789",
    });
    await t.run(async (ctx) => {
      const row = await ctx.db
        .query("petitionerBasics")
        .withIndex("by_application", (q) => q.eq("applicationId", applicationId))
        .first();
      if (!row?.ssn) throw new Error("missing");
      await ctx.db.patch(row._id, { ssn: { ...row.ssn, keyVersion: 99 } });
    });
    await expect(
      alice.query(internal.sensitive.loadForFill, { applicationId }),
    ).rejects.toThrow("Unsupported key version");

    await t.run(async (ctx) => {
      const row = await ctx.db
        .query("petitionerBasics")
        .withIndex("by_application", (q) => q.eq("applicationId", applicationId))
        .first();
      if (!row?.ssn) throw new Error("missing");
      await ctx.db.patch(row._id, { ssn: { ...row.ssn, keyVersion: 1 } });
    });
    process.env.SENSITIVE_ID_KEY_PREVIOUS = key(7);
    process.env.SENSITIVE_ID_KEY_PREVIOUS_VERSION = "1";
    process.env.SENSITIVE_ID_KEY = key(9);
    process.env.SENSITIVE_ID_KEY_VERSION = "2";
    expect(await t.mutation(internal.sensitive.reencryptAll, {})).toEqual({ updated: 1 });
    const plain = await alice.query(internal.sensitive.loadForFill, { applicationId });
    expect(plain.ssn).toBe("123-45-6789");
  });

  test("adds decrypted ids only inside the PDF fill call", async () => {
    const { alice, applicationId } = await seeded();
    await alice.mutation(api.sensitive.saveSensitiveIds, {
      applicationId,
      ssn: "123-45-6789",
      aNumber: "A1234567",
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response("%PDF-demo", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const pdf = await alice.action(api.sensitive.fillI130, {
      applicationId,
      fields: {
        "form1[0].#subform[0].Pt2Line4a_FamilyName[0]": "Lovelace",
        "form1[0].#subform[0].Pt2Line11_SSN[0]": "999-99-9999",
      },
      checkboxes: {},
    });
    expect(pdf).not.toContain("123-45-6789");
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("fill was not called");
    const init = call[1] as { body?: string; headers?: Record<string, string> };
    const body = JSON.parse(init.body ?? "{}") as { fields: Record<string, string> };
    expect(body.fields["form1[0].#subform[0].Pt2Line11_SSN[0]"]).toBe("123-45-6789");
    expect(body.fields["form1[0].#subform[0].#area[4].Pt2Line1_AlienNumber[0]"]).toBe("A1234567");
    expect(init.headers?.["X-Fill-Secret"]).toBe("fill-secret");
    vi.unstubAllGlobals();
  });

  test("delete removes every row for that owner only", async () => {
    const { t, alice, bob, applicationId } = await seeded();
    await alice.mutation(api.sensitive.saveSensitiveIds, {
      applicationId,
      ssn: "123-45-6789",
    });
    const bobId = await bob.mutation(api.petitioner.getOrCreateApplication, {});
    await bob.mutation(api.petitioner.savePetitionerBasics, { applicationId: bobId, ...basics });
    expect(await alice.mutation(api.petitioner.deleteMyApplication, {})).toEqual({ deleted: 1 });
    const remaining = await t.run(async (ctx) => {
      const applications = await ctx.db.query("applications").collect();
      const basicsRows = await ctx.db.query("petitionerBasics").collect();
      return { applications, basicsRows };
    });
    expect(remaining.applications.map((row) => row._id)).toEqual([bobId]);
    expect(remaining.basicsRows).toHaveLength(1);
    expect(JSON.stringify(remaining)).not.toContain("123-45-6789");
  });
});
