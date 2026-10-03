"use client";

import { QuestionRun } from "@/components/intake/QuestionRun";
import { sponsorSteps } from "@/app/lib/intake/steps";

export default function SponsorPage() {
  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-xl text-sm leading-6">
        The I-864 asks for household size and income. AOS does not say whether the amount is enough.
      </p>
      <QuestionRun steps={sponsorSteps} href="/sections/sponsor" doneHref="/sections" />
    </div>
  );
}
