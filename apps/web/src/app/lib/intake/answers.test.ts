import { describe, expect, it } from "vitest";
import { intakeHasAnswers } from "./answers";
import { demoIntake } from "./demo";
import { emptyIntake } from "./empty";

describe("intakeHasAnswers", () => {
  it("ignores the disclaimer acknowledgement and treats the demo as filled", () => {
    const acknowledged = emptyIntake();
    acknowledged.disclaimerAckAt = "2026-10-03T00:00:00.000Z";
    expect(intakeHasAnswers(acknowledged)).toBe(false);
    expect(intakeHasAnswers(demoIntake())).toBe(true);
    const named = emptyIntake();
    named.petitioner.givenName = "Ada";
    expect(intakeHasAnswers(named)).toBe(true);
  });
});
