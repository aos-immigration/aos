// @vitest-environment edge-runtime
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

declare global {
  interface ImportMeta {
    glob(pattern: string | string[]): Record<string, () => Promise<unknown>>;
  }
}

const modules = import.meta.glob("./**/*.*s");

const basics = {
  givenName: "Ada",
  familyName: "Lovelace",
  dateOfBirth: { month: "12", day: "10", year: "1815" },
  citizenshipStatus: "us_citizen",
  relationship: "spouse",
};

function address(applicationId: Id<"applications">) {
  return {
    applicationId,
    personRole: "petitioner",
    street: "1 Main",
    city: "Austin",
    state: "TX",
    zip: "78701",
    country: "United States",
    startMonth: "01",
    startYear: "2020",
    isCurrent: true,
    addressType: "physical",
    sortOrder: 0,
  };
}

function employment(applicationId: Id<"applications">) {
  return {
    applicationId,
    personRole: "petitioner",
    status: "employed",
    employerName: "Acme",
    jobTitle: "Engineer",
    country: "United States",
    fromMonth: "01",
    fromYear: "2020",
    isCurrent: true,
    sortOrder: 0,
  };
}

function users() {
  const t = convexTest(schema, modules);
  return {
    t,
    alice: t.withIdentity({ subject: "user_alice" }),
    bob: t.withIdentity({ subject: "user_bob" }),
  };
}

describe("application ownership", () => {
  test("gives each signed-in user their own application", async () => {
    const { alice, bob } = users();
    const aliceId = await alice.mutation(api.petitioner.getOrCreateApplication, {});
    const bobId = await bob.mutation(api.petitioner.getOrCreateApplication, {});

    expect(aliceId).not.toEqual(bobId);
    expect(await alice.mutation(api.petitioner.getOrCreateApplication, {})).toEqual(aliceId);
    expect(await alice.mutation(api.petitioner.createApplication, {})).toEqual(aliceId);
  });

  test("refuses anonymous callers", async () => {
    const { t, alice } = users();
    const applicationId = await alice.mutation(api.petitioner.getOrCreateApplication, {});

    await expect(t.mutation(api.petitioner.getOrCreateApplication, {})).rejects.toThrow(
      "Not authenticated",
    );
    await expect(
      t.query(api.petitioner.getPetitionerBasics, { applicationId }),
    ).rejects.toThrow("Not authenticated");
    await expect(t.query(api.forms.listForms, {})).rejects.toThrow("Not authenticated");
  });

  test("refuses reads and writes of another user's records", async () => {
    const { alice, bob } = users();
    const aliceId = await alice.mutation(api.petitioner.getOrCreateApplication, {});
    const bobId = await bob.mutation(api.petitioner.getOrCreateApplication, {});
    await alice.mutation(api.petitioner.savePetitionerBasics, {
      applicationId: aliceId,
      ...basics,
    });
    const addressId = await alice.mutation(api.petitioner.saveAddress, address(aliceId));
    const employmentId = await alice.mutation(
      api.petitioner.saveEmploymentEntry,
      employment(aliceId),
    );

    await expect(
      bob.query(api.petitioner.getPetitionerBasics, { applicationId: aliceId }),
    ).rejects.toThrow("Application not found");
    await expect(
      bob.query(api.petitioner.listAddresses, {
        applicationId: aliceId,
        personRole: "petitioner",
      }),
    ).rejects.toThrow("Application not found");
    await expect(
      bob.query(api.petitioner.listEmploymentEntries, {
        applicationId: aliceId,
        personRole: "petitioner",
      }),
    ).rejects.toThrow("Application not found");
    await expect(
      bob.mutation(api.petitioner.savePetitionerBasics, {
        applicationId: aliceId,
        ...basics,
        givenName: "Eve",
      }),
    ).rejects.toThrow("Application not found");
    await expect(
      bob.mutation(api.petitioner.saveAddress, { _id: addressId, ...address(bobId) }),
    ).rejects.toThrow("Address not found");
    await expect(
      bob.mutation(api.petitioner.saveAddress, { ...address(aliceId) }),
    ).rejects.toThrow("Application not found");
    await expect(bob.mutation(api.petitioner.removeAddress, { id: addressId })).rejects.toThrow(
      "Address not found",
    );
    await expect(
      bob.mutation(api.petitioner.saveEmploymentEntry, {
        _id: employmentId,
        ...employment(bobId),
      }),
    ).rejects.toThrow("Employment entry not found");
    await expect(
      bob.mutation(api.petitioner.removeEmploymentEntry, { id: employmentId }),
    ).rejects.toThrow("Employment entry not found");

    const stillBasics = await alice.query(api.petitioner.getPetitionerBasics, {
      applicationId: aliceId,
    });
    const stillAddresses = await alice.query(api.petitioner.listAddresses, {
      applicationId: aliceId,
      personRole: "petitioner",
    });
    const stillEmployment = await alice.query(api.petitioner.listEmploymentEntries, {
      applicationId: aliceId,
      personRole: "petitioner",
    });
    expect(stillBasics?.givenName).toBe("Ada");
    expect(stillAddresses).toHaveLength(1);
    expect(stillEmployment).toHaveLength(1);
    expect(await bob.query(api.forms.listForms, {})).toEqual([]);
  });
});
