"use client";

import { Button } from "@/components/ui/button";
import type { AddressEntry } from "@/app/lib/intakeStorage";
import { formatDateRange } from "@/app/lib/dateUtils";

type AddressCardProps = {
  address: AddressEntry;
  onEdit: () => void;
  onRemove: () => void;
  showRemove?: boolean;
};

export function AddressCard({
  address,
  onEdit,
  onRemove,
  showRemove = true,
}: AddressCardProps) {
  const formattedAddress = [
    address.street?.trim(),
    address.unit?.trim(),
    address.city?.trim(),
    address.state?.trim(),
    address.zip?.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const dateRange = formatDateRange(
    address.startMonth,
    address.startYear,
    address.endMonth,
    address.endYear
  );

  return (
    <div className="group relative rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {address.isCurrent && (
            <span className="mb-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              Current
            </span>
          )}
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {formattedAddress || "Address incomplete"}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {dateRange || "Dates not specified"}
          </p>
          {address.gapExplanation && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Gap explanation: {address.gapExplanation}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Edit
          </Button>
          {showRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
