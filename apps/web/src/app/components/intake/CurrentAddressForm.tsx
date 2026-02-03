"use client";

import type { AddressEntry } from "@/app/lib/intakeStorage";
import type { ValidationErrors } from "@/app/lib/addressValidation";
import { AddressForm } from "./AddressForm";

type CurrentAddressFormProps = {
  address: AddressEntry;
  onChange: (address: AddressEntry) => void;
  errors?: ValidationErrors;
  disabled?: boolean;
};

export function CurrentAddressForm({
  address,
  onChange,
  errors,
  disabled,
}: CurrentAddressFormProps) {
  const handleChange = (updated: AddressEntry) => {
    onChange({
      ...updated,
      isCurrent: true,
      endMonth: undefined,
      endYear: undefined,
      endDay: undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Current Address
        </h3>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
          Present
        </span>
      </div>
      <AddressForm
        address={{ ...address, isCurrent: true }}
        onChange={handleChange}
        errors={errors}
        showEndDate={false}
        disabled={disabled}
      />
    </div>
  );
}
