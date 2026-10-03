import { describe, expect, it } from "vitest";
import { checkIntake } from "./checks";
import { demoIntake } from "./demo";
import { documentSlots } from "./documents";
import { emptyIntake } from "./empty";
import { feeTotal } from "./fees";
import { reviewUnlocked } from "./progress";
import { parseIntake } from "./schema";

const AS_OF = new Date(2026, 9, 3);

describe("empty intake", () => {
  it("starts with no forms and no answered eligibility questions", () => {
    const intake = emptyIntake();
    expect(intake.selectedForms).toEqual([]);
    expect(intake.eligibility.every((item) => item.answer === "unanswered")).toBe(true);
    expect(checkIntake(intake, AS_OF)).toEqual([]);
    expect(reviewUnlocked(intake, AS_OF)).toBe(false);
  });
});

describe("checkIntake", () => {
  it("flags overlapping addresses and a gap with no explanation", () => {
    const intake = emptyIntake();
    intake.addresses = [
      {
        ...address("a"),
        startMonth: "01",
        startYear: "2024",
        endMonth: "06",
        endYear: "2024",
        isCurrent: false,
      },
      {
        ...address("b"),
        startMonth: "06",
        startYear: "2024",
        endMonth: "12",
        endYear: "2024",
        isCurrent: false,
      },
    ];
    const overlap = checkIntake(intake, AS_OF).map((issue) => issue.id);
    expect(overlap.some((id) => id.includes("overlap"))).toBe(true);

    intake.addresses[1] = {
      ...intake.addresses[1]!,
      startMonth: "09",
      gapExplanation: "",
    };
    const gap = checkIntake(intake, AS_OF);
    expect(gap.some((issue) => issue.summary.includes("gap"))).toBe(true);
    expect(gap.find((issue) => issue.summary.includes("gap"))?.href).toBe(
      "/sections/petitioner/address",
    );

    intake.addresses[1] = {
      ...intake.addresses[1]!,
      gapExplanation: "Lived with family while between leases.",
    };
    const explained = checkIntake(intake, AS_OF);
    expect(explained.some((issue) => issue.summary.includes("gap"))).toBe(false);
  });

  it("flags a prior marriage that ends after the current marriage", () => {
    const intake = emptyIntake();
    intake.marriage.date = { month: "06", day: "15", year: "2024" };
    intake.priorMarriages = [
      {
        id: "prior-1",
        personRole: "petitioner",
        spouseGiven: "Pat",
        spouseFamily: "Notreal",
        startMonth: "01",
        startYear: "2018",
        endMonth: "08",
        endYear: "2024",
        howEnded: "divorce",
      },
    ];
    const issues = checkIntake(intake, AS_OF);
    expect(issues.map((issue) => issue.href)).toContain("/sections/marital");
  });

  it("flags different current addresses when the couple lives together", () => {
    const intake = emptyIntake();
    intake.marriage.liveTogether = "yes";
    intake.addresses = [
      { ...address("pet"), street: "100 Fictional Lane", city: "Sample City", postal: "00000" },
      {
        ...address("ben"),
        personRole: "beneficiary",
        street: "9 Other Road",
        city: "Sample City",
        postal: "00000",
      },
    ];
    const issues = checkIntake(intake, AS_OF);
    expect(issues.some((issue) => issue.id === "live-together-address")).toBe(true);
  });

  it("accepts a foreign postal code and rejects a short US ZIP", () => {
    const intake = emptyIntake();
    intake.addresses = [
      { ...address("foreign"), country: "Fictionland", postal: "AB-12" },
    ];
    expect(checkIntake(intake, AS_OF).some((issue) => issue.id.startsWith("postal"))).toBe(
      false,
    );
    intake.addresses = [{ ...address("us"), country: "United States", postal: "123" }];
    expect(checkIntake(intake, AS_OF).some((issue) => issue.id.startsWith("postal"))).toBe(
      true,
    );
  });
});

describe("demo couple", () => {
  it("uses obviously fake identifiers and has no open issues", () => {
    const intake = demoIntake();
    expect(intake.source).toBe("demo");
    expect(intake.petitioner.familyName).toBe("Sampleton");
    expect(intake.beneficiary.familyName).toBe("Exampleton");
    expect(intake.petitioner.ssn).toBe("000-00-0000");
    expect(intake.beneficiary.aNumber).toBe("A000000001");
    expect(intake.petitioner.email.endsWith("@example.com")).toBe(true);
    expect(checkIntake(intake, AS_OF)).toEqual([]);
    expect(reviewUnlocked(intake, AS_OF)).toBe(true);
  });
});

describe("fees", () => {
  it("sums the G-1055 paper and online amounts for the marriage packet", () => {
    const forms = ["i-130", "i-130a", "i-485", "i-864", "i-765", "i-131", "g-1145"] as const;
    expect(feeTotal(forms, "paper")).toBe(675 + 1440 + 260 + 630);
    expect(feeTotal(forms, "online")).toBe(625 + 1390 + 260 + 580);
  });
});

describe("documents", () => {
  it("adds a divorce slot only after a prior marriage is listed", () => {
    const intake = emptyIntake();
    expect(documentSlots(intake).some((slot) => slot.slot === "divorce-decree")).toBe(false);
    intake.priorMarriages = [
      {
        id: "prior-1",
        personRole: "beneficiary",
        spouseGiven: "Pat",
        spouseFamily: "Notreal",
        startMonth: "01",
        startYear: "2015",
        endMonth: "01",
        endYear: "2018",
        howEnded: "divorce",
      },
    ];
    const divorce = documentSlots(intake).find((slot) => slot.slot === "divorce-decree");
    expect(divorce?.why).toBe("Because a prior marriage is listed.");
  });
});

describe("parseIntake", () => {
  it("rejects a payload that is not the intake shape", () => {
    expect(() => parseIntake("{")).toThrow("Intake payload is not valid JSON.");
    expect(() => parseIntake("{}")).toThrow(/Intake field .+ is invalid/);
  });

  it("reads a serialized empty intake", () => {
    const intake = emptyIntake();
    expect(parseIntake(JSON.stringify(intake))).toEqual(intake);
  });
});

function address(id: string) {
  return {
    id,
    personRole: "petitioner" as const,
    kind: "physical" as const,
    street: "100 Fictional Lane",
    unitType: "" as const,
    unit: "",
    city: "Sample City",
    state: "CA",
    province: "",
    postal: "00000",
    country: "United States",
    startMonth: "10" as const,
    startYear: "2021",
    endMonth: "" as const,
    endYear: "",
    isCurrent: true,
    gapExplanation: "",
  };
}
