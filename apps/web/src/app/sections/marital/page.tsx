"use client";

import { QuestionRun } from "@/components/intake/QuestionRun";
import { maritalSteps } from "@/app/lib/intake/steps";

export default function MaritalPage() {
  return (
    <QuestionRun steps={maritalSteps} href="/sections/marital" doneHref="/sections/immigration" />
  );
}
