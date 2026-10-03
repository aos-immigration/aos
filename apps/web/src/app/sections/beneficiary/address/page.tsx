"use client";

import { AddressHistoryEditor } from "@/components/intake/HistoryEditors";

export default function BeneficiaryAddressPage() {
  return (
    <AddressHistoryEditor
      role="beneficiary"
      title="Where has the beneficiary lived?"
      nextHref="/sections/beneficiary/employment"
    />
  );
}
