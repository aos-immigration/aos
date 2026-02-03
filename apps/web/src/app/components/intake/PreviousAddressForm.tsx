"use client";

import { useEffect, useState } from "react";
import type { AddressEntry } from "@/app/lib/intakeStorage";
import type { ValidationErrors } from "@/app/lib/addressValidation";
import { hasSignificantGap } from "@/app/lib/gapDetection";
import { AddressForm } from "./AddressForm";
import { GapExplanationDialog } from "./GapExplanationDialog";

type PreviousAddressFormProps = {
  address: AddressEntry;
  onChange: (address: AddressEntry) => void;
  errors?: ValidationErrors;
  disabled?: boolean;
  previousAddress?: AddressEntry;
  index: number;
};

export function PreviousAddressForm({
  address,
  onChange,
  errors,
  disabled,
  previousAddress,
  index,
}: PreviousAddressFormProps) {
  const [showGapDialog, setShowGapDialog] = useState(false);

  const hasGap =
    previousAddress &&
    address.startMonth &&
    address.startYear &&
    hasSignificantGap(previousAddress, address);

  useEffect(() => {
    if (hasGap && !address.gapExplanation) {
      setShowGapDialog(true);
    }
  }, [hasGap, address.gapExplanation]);

  const handleChange = (updated: AddressEntry) => {
    onChange({
      ...updated,
      isCurrent: false,
    });
  };

  const handleGapExplanation = (explanation: string) => {
    onChange({
      ...address,
      gapExplanation: explanation,
    });
    setShowGapDialog(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Previous Address {index}
      </h3>

      {hasGap && address.gapExplanation && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          Gap explanation: {address.gapExplanation}
          <button
            type="button"
            onClick={() => setShowGapDialog(true)}
            className="ml-2 underline"
          >
            Edit
          </button>
        </div>
      )}

      <AddressForm
        address={{ ...address, isCurrent: false }}
        onChange={handleChange}
        errors={errors}
        showEndDate={true}
        disabled={disabled}
      />

      <GapExplanationDialog
        open={showGapDialog}
        onOpenChange={setShowGapDialog}
        onSave={handleGapExplanation}
        currentExplanation={address.gapExplanation}
      />
    </div>
  );
}
