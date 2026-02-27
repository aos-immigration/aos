"use client";

import { useApplicationId } from "@/app/lib/useApplicationId";
import { EmploymentHistory } from "@/app/components/intake/EmploymentHistory";

export default function PetitionerEmploymentPage() {
  const applicationId = useApplicationId();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Petitioner Employment History
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Provide your employment history for the past 5 years. Include all
            employers, even if you worked part-time or for a short period.
          </p>
        </div>
      </div>

      {applicationId ? (
        <EmploymentHistory applicationId={applicationId} />
      ) : (
        <div className="text-sm text-muted-foreground">Loading...</div>
      )}
    </div>
  );
}
