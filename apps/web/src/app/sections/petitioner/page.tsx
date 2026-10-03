"use client";

import { QuestionRun } from "@/components/intake/QuestionRun";
import { petitionerSteps } from "@/app/lib/intake/steps";

export default function PetitionerPage() {
  return (
    <QuestionRun
      steps={petitionerSteps}
      href="/sections/petitioner"
      doneHref="/sections/petitioner/address"
    />
  );
}
