// @vitest-environment edge-runtime
import { convexTest } from "convex-test";
import { describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { emptyIntake } from "../src/app/lib/intake/empty";
import { encodeBase64 } from "./sensitiveCrypto";
import { STORED_ID_FIELD_NAMES } from "./storedIds";

declare global {
  interface ImportMeta {
    glob(pattern: string | string[]): Record<string, () => Promise<unknown>>;
  }
}

const modules = import.meta.glob("./**/*.*s");

describe("stored id writes", () => {
  test("saveIntake drops every catalogued id for petitioner and beneficiary", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "user_alice" });
    const applicationId = await alice.mutation(api.petitioner.getOrCreateApplication, {});
    const intake = emptyIntake();
    const sentinels: string[] = [];
    const buckets = [intake.petitioner, intake.beneficiary, intake.immigration];
    for (const name of STORED_ID_FIELD_NAMES) {
      const sentinel = `PLAIN-${name}-VALUE`;
      sentinels.push(sentinel);
      for (const bucket of buckets) {
        (bucket as Record<string, unknown>)[name] = sentinel;
      }
    }
    await alice.mutation(api.intake.saveIntake, {
      applicationId,
      payload: JSON.stringify(intake),
    });
    const stored = await t.run(async (ctx) => {
      const row = await ctx.db.query("intakes").first();
      return row?.payload ?? "";
    });
    for (const sentinel of sentinels) {
      expect(stored).not.toContain(sentinel);
    }
    const parsed = JSON.parse(stored) as {
      petitioner: { ssn: string; aNumber: string };
      beneficiary: { ssn: string; aNumber: string };
      immigration: { i94Number: string; passportNumber: string };
    };
    expect(parsed.petitioner.ssn).toBe("");
    expect(parsed.petitioner.aNumber).toBe("");
    expect(parsed.beneficiary.ssn).toBe("");
    expect(parsed.beneficiary.aNumber).toBe("");
    expect(parsed.immigration.i94Number).toBe("");
    expect(parsed.immigration.passportNumber).toBe("");
  });

  test("encrypts ssn and a-number for both people and hides them from the other user", async () => {
    process.env.SENSITIVE_ID_KEY = encodeBase64(new Uint8Array(32).fill(4));
    process.env.SENSITIVE_ID_KEY_VERSION = "1";
    process.env.PDF_FILL_SECRET = "fill-secret";
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "user_alice" });
    const bob = t.withIdentity({ subject: "user_bob" });
    const applicationId = await alice.mutation(api.petitioner.getOrCreateApplication, {});
    const intake = emptyIntake();
    intake.petitioner.ssn = "123-45-6789";
    intake.petitioner.aNumber = "A1234567";
    intake.beneficiary.ssn = "123-45-6788";
    intake.beneficiary.aNumber = "A7654321";
    intake.immigration.i94Number = "PLAIN-i94Number-VALUE";
    intake.immigration.passportNumber = "PLAIN-passportNumber-VALUE";
    await alice.mutation(api.intake.saveIntake, {
      applicationId,
      payload: JSON.stringify(intake),
    });
    const stored = await t.run(async (ctx) => {
      const row = await ctx.db.query("intakes").first();
      return row?.payload ?? "";
    });
    expect(stored).not.toContain("123-45-6789");
    expect(stored).not.toContain("123-45-6788");
    expect(stored).not.toContain("A1234567");
    expect(stored).not.toContain("A7654321");
    expect(stored).not.toContain("PLAIN-i94Number-VALUE");
    expect(stored).not.toContain("PLAIN-passportNumber-VALUE");
    const parsed = JSON.parse(stored) as {
      petitioner: { ssn: { ciphertext: string; last4: string }; aNumber: { last4: string } };
      beneficiary: { ssn: { last4: string }; aNumber: { last4: string } };
      immigration: { i94Number: string; passportNumber: string };
    };
    expect(parsed.petitioner.ssn.ciphertext.length).toBeGreaterThan(10);
    expect(parsed.petitioner.ssn.last4).toBe("6789");
    expect(parsed.petitioner.aNumber.last4).toBe("4567");
    expect(parsed.beneficiary.ssn.last4).toBe("6788");
    expect(parsed.beneficiary.aNumber.last4).toBe("4321");
    expect(parsed.immigration.i94Number).toBe("");
    expect(parsed.immigration.passportNumber).toBe("");

    const visible = await alice.query(api.intake.getIntake, { applicationId });
    expect(visible?.payload).not.toContain("123-45-6789");
    expect(JSON.parse(visible?.payload ?? "{}").petitioner.ssn).toBe("6789");
    await expect(bob.query(api.intake.getIntake, { applicationId })).rejects.toThrow(
      "Application not found",
    );
    await expect(
      bob.mutation(api.intake.saveIntake, {
        applicationId,
        payload: JSON.stringify(intake),
      }),
    ).rejects.toThrow("Application not found");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ forms: [], notes: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const preview = await alice.action(api.intake.previewOwnedIntake, {});
    expect(JSON.stringify(preview)).not.toContain("123-45-6789");
    const init = fetchMock.mock.calls[0]?.[1] as { body?: string; headers?: Record<string, string> };
    const body = JSON.parse(init.body ?? "{}") as {
      intake: { petitioner: { ssn: string; familyName: string } };
    };
    expect(body.intake.petitioner.ssn).toBe("123-45-6789");
    expect(init.headers?.["X-Fill-Caller"]).toBe("user_alice");
    expect(init.headers?.["X-Fill-Secret"]).toBe("fill-secret");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/preview-intake");
    vi.unstubAllGlobals();
  });
});
