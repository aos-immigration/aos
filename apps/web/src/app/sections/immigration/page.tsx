"use client";

import { QuestionRun } from "@/components/intake/QuestionRun";
import { immigrationSteps } from "@/app/lib/intake/steps";

export default function ImmigrationPage() {
  return (
    <QuestionRun
      steps={immigrationSteps}
      href="/sections/immigration"
      doneHref="/sections/eligibility"
    />
  );
}
