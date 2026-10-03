import { describe, expect, it } from "vitest";
import { emptyIntake } from "./empty";
import { memoryIntake, resetMemoryIntake, setMemoryIntake } from "./memory";
import { readPath, toggleForm, writePath } from "./path";
import {
  beneficiarySteps,
  biographicSteps,
  eligibilitySteps,
  immigrationSteps,
  maritalSteps,
  petitionerSteps,
  sponsorSteps,
  stepPaths,
} from "./steps";

describe("writePath", () => {
  it("updates a nested answer and leaves the original intake alone", () => {
    const intake = emptyIntake();
    const next = writePath(intake, "petitioner.givenName", "Ada");
    expect(next.petitioner.givenName).toBe("Ada");
    expect(intake.petitioner.givenName).toBe("");
    expect(readPath(next, "eligibility.0.answer")).toBe("unanswered");
  });

  it("toggles a form without recommending one", () => {
    const intake = emptyIntake();
    const selected = toggleForm(intake, "i-130");
    expect(selected.selectedForms).toEqual(["i-130"]);
    expect(toggleForm(selected, "i-130").selectedForms).toEqual([]);
  });
});

describe("question paths", () => {
  it("points every question at a field on the empty intake", () => {
    const intake = emptyIntake();
    const paths = stepPaths([
      ...petitionerSteps,
      ...beneficiarySteps,
      ...maritalSteps,
      ...biographicSteps,
      ...immigrationSteps,
      ...eligibilitySteps,
      ...sponsorSteps,
    ]);
    expect(paths.length).toBeGreaterThan(20);
    for (const path of paths) {
      expect(readPath(intake, path)).not.toBeUndefined();
    }
  });
});

describe("memory intake", () => {
  it("keeps the latest answers in the module store", () => {
    resetMemoryIntake();
    const next = writePath(emptyIntake(), "beneficiary.familyName", "Exampleton");
    setMemoryIntake(next);
    expect(memoryIntake().beneficiary.familyName).toBe("Exampleton");
    resetMemoryIntake();
    expect(memoryIntake().beneficiary.familyName).toBe("");
  });
});
