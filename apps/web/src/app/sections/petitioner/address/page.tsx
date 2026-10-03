"use client";

import { AddressHistoryEditor } from "@/components/intake/HistoryEditors";

export default function PetitionerAddressPage() {
  return (
    <AddressHistoryEditor
      role="petitioner"
      title="Where has the petitioner lived?"
      nextHref="/sections/petitioner/employment"
    />
  );
}
