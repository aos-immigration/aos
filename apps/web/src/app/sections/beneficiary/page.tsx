"use client";

import { QuestionRun } from "@/components/intake/QuestionRun";
import { beneficiarySteps } from "@/app/lib/intake/steps";

export default function BeneficiaryPage() {
  return (
    <QuestionRun
      steps={beneficiarySteps}
      href="/sections/beneficiary"
      doneHref="/sections/beneficiary/address"
    />
  );
}
