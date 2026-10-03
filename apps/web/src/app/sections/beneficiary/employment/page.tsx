"use client";

import { EmploymentHistoryEditor } from "@/components/intake/HistoryEditors";

export default function BeneficiaryEmploymentPage() {
  return (
    <EmploymentHistoryEditor
      role="beneficiary"
      title="Where has the beneficiary worked or studied?"
      nextHref="/sections/beneficiary/biographic"
    />
  );
}
