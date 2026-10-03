// @vitest-environment edge-runtime
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { emptyIntake } from "../src/app/lib/intake/empty";
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
});
