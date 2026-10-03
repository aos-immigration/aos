"use client";

import { QuestionRun } from "@/components/intake/QuestionRun";
import { biographicSteps } from "@/app/lib/intake/steps";

export default function BiographicPage() {
  return (
    <QuestionRun
      steps={biographicSteps}
      href="/sections/beneficiary/biographic"
      doneHref="/sections/marital"
    />
  );
}
