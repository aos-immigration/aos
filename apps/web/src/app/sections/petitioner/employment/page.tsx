"use client";

import { EmploymentHistoryEditor } from "@/components/intake/HistoryEditors";

export default function PetitionerEmploymentPage() {
  return (
    <EmploymentHistoryEditor
      role="petitioner"
      title="Where has the petitioner worked or studied?"
      nextHref="/sections/beneficiary"
    />
  );
}
