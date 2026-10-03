import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { STORED_ID_FIELD_NAMES, stripStoredIds } from "../../../../convex/storedIds";

describe("stored id fields", () => {
  it("blanks every catalogued id on the petitioner and the beneficiary", () => {
    const input: { petitioner: Record<string, unknown>; beneficiary: Record<string, unknown> } = {
      petitioner: {},
      beneficiary: {},
    };
    for (const name of STORED_ID_FIELD_NAMES) {
      input.petitioner[name] = `petitioner-${name}-SECRET`;
      input.beneficiary[name] = `beneficiary-${name}-SECRET`;
    }
    input.petitioner.ssn = {
      ciphertext: "already-sealed",
      iv: "iv",
      keyVersion: 1,
      last4: "6789",
    };
    const stored = stripStoredIds(input);
    const serialized = JSON.stringify(stored);
    expect(serialized).not.toContain("SECRET");
    expect(stored.petitioner.ssn).toEqual({
      ciphertext: "already-sealed",
      iv: "iv",
      keyVersion: 1,
      last4: "6789",
    });
    for (const name of STORED_ID_FIELD_NAMES) {
      if (name === "ssn") continue;
      expect(stored.petitioner[name]).toBe("");
      expect(stored.beneficiary[name]).toBe("");
    }
    expect(stored.beneficiary.ssn).toBe("");
  });

  it("rejects a plaintext string column and a console log of those fields", () => {
    const dir = path.resolve(__dirname, "../../../../convex");
    const files = readdirSync(dir).filter(
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts") && !file.endsWith(".d.ts"),
    );
    expect(files).toContain("schema.ts");
    for (const file of files) {
      const source = readFileSync(path.join(dir, file), "utf8");
      for (const name of STORED_ID_FIELD_NAMES) {
        expect(source, `${file} ${name}`).not.toMatch(
          new RegExp(`\\b${name}\\s*:\\s*v\\.(?:optional\\(\\s*)?string\\(`),
        );
      }
      expect(source, file).not.toMatch(/console\.(log|info|debug|warn|error|trace)\s*\(/);
    }
  });
});
