import { emptyIntake } from "./empty";
import type { Intake } from "./schema";

function comparable(intake: Intake): string {
  return JSON.stringify({ ...intake, source: "user", disclaimerAckAt: null });
}

export function intakeHasAnswers(intake: Intake): boolean {
  return comparable(intake) !== comparable(emptyIntake());
}
