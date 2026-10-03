import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { demoIntake } from "../intake/demo";
import { maskANumberLast4, maskSsnLast4, redactFillPayload } from "../sensitiveId";
import { redactSensitiveText, scrubUrl } from "../../../lib/redactTelemetry";

describe("sensitive id masking", () => {
  it("shows only the last four digits", () => {
    expect(maskSsnLast4("6789")).toBe("•••-••-6789");
    expect(maskSsnLast4(null)).toBe("•••-••-••••");
    expect(maskANumberLast4("6789")).toBe("A••••6789");
    expect(JSON.stringify(maskSsnLast4("6789"))).not.toContain("123-45-6789");
  });

  it("strips a whole SSN or A-Number from a fill payload and leaves an address", () => {
    const redacted = redactFillPayload({
      fields: {
        ssn: "123-45-6789",
        alien: "A123456789",
        street: "1 Demo Lane",
        zip: "00000",
      },
      checkboxes: { yes: true },
    });
    expect(redacted.fields.ssn).toBe("");
    expect(redacted.fields.alien).toBe("");
    expect(redacted.fields.street).toBe("1 Demo Lane");
    expect(redacted.fields.zip).toBe("00000");
  });
});

describe("demo couple", () => {
  it("is Jordan Sampleton and Avery Exampleton", () => {
    const intake = demoIntake();
    const blob = JSON.stringify(intake);
    expect(intake.petitioner.givenName).toBe("Jordan");
    expect(intake.petitioner.familyName).toBe("Sampleton");
    expect(intake.beneficiary.givenName).toBe("Avery");
    expect(intake.beneficiary.familyName).toBe("Exampleton");
    expect(blob).toContain("example.com");
    expect(blob).not.toContain("Alex Demo");
    expect(blob).not.toContain("Jamie Demo");
    expect(blob).not.toContain("123-45-6789");
  });
});

describe("telemetry redaction", () => {
  it("drops identifiers and query strings", () => {
    expect(redactSensitiveText("ssn 123-45-6789 and A123456789")).toBe(
      "ssn [redacted] and [redacted]",
    );
    expect(scrubUrl("https://app.example/sections?ssn=123-45-6789#x")).toBe(
      "https://app.example/sections",
    );
  });
});

describe("convex public functions", () => {
  it("derives the caller before touching an application", () => {
    const dir = path.resolve(__dirname, "../../../../convex");
    const files = ["petitioner.ts", "forms.ts", "sensitive.ts", "intake.ts"];
    const declaration = /export const (\w+) = (query|mutation|action)\(/g;
    for (const file of files) {
      const source = readFileSync(path.join(dir, file), "utf8");
      const matches = [...source.matchAll(declaration)];
      expect(matches.length).toBeGreaterThan(0);
      for (const match of matches) {
        const start = match.index ?? 0;
        const next = source.indexOf("\nexport const ", start + 1);
        const body = source.slice(start, next === -1 ? undefined : next);
        expect(body, `${file} ${match[1]}`).toMatch(
          /requireUserId|requireOwned|applicationForUser/,
        );
      }
    }
    const petitioner = readFileSync(path.join(dir, "petitioner.ts"), "utf8");
    const helper = petitioner.slice(petitioner.indexOf("async function applicationForUser"));
    expect(helper).toMatch(/requireUserId/);
  });
});
