"use client";

import { QuestionRun } from "@/components/intake/QuestionRun";
import { eligibilitySteps } from "@/app/lib/intake/steps";

export default function EligibilityPage() {
  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-xl text-sm leading-6">
        These questions are copied onto I-485. A yes or no is your answer. AOS does not decide whether you can file.
      </p>
      <QuestionRun
        steps={eligibilitySteps}
        href="/sections/eligibility"
        doneHref="/sections/sponsor"
      />
    </div>
  );
}
