"use client";

import { AddressHistory } from "@/app/components/intake/AddressHistory";
import { DemoAddressView } from "@/app/components/intake/DemoCoupleViews";
import { useApplicationId } from "@/app/lib/useApplicationId";
import { useDemoMode } from "@/app/lib/intakeMode";

export default function PetitionerAddressPage() {
  const demo = useDemoMode();
  const applicationId = useApplicationId();

  if (demo) return <DemoAddressView who="Alex Demo" />;

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
