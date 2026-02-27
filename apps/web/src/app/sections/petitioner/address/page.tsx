"use client";

import { AddressHistory } from "@/app/components/intake/AddressHistory";
import { useApplicationId } from "@/app/lib/useApplicationId";

export default function PetitionerAddressPage() {
  const applicationId = useApplicationId();

  if (!applicationId) {
    return <div className="max-w-5xl mx-auto py-12 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Petitioner Address History
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Provide your address history for the past 5 years. Include all
            addresses where you have lived, even if temporary.
          </p>
        </div>
      </div>

      <AddressHistory applicationId={applicationId} personRole="petitioner" />
    </div>
  );
}
