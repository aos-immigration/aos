"use client";

// TODO: This component uses manual validation. It should eventually be migrated to
// use React Hook Form + Zod, or be replaced by the AddressHistory component
// once that component supports controlled props.

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StepShell } from "./StepShell";
import { getMonthOptions } from "@/app/lib/dateUtils";
import { US_STATES } from "@/app/lib/constants";
import type { IntakeData, AddressEntry, MonthValue } from "@/app/lib/intakeStorage";

const MONTHS = getMonthOptions();
const STATE_OPTIONS = US_STATES.map((s) => ({ value: s, label: s }));

type RenderSelectFn = (
  value: string,
  onChange: (value: string) => void,
  placeholder: string,
  options: Array<{ value: string; label: string }>,
  className?: string,
  disabled?: boolean
) => React.ReactElement;

const renderSelect: RenderSelectFn = (
  value,
  onChange,
  placeholder,
  options,
  className,
  disabled
) => (
  <Select
    value={value || undefined}
    onValueChange={onChange}
    disabled={disabled ?? false}
  >
    <SelectTrigger className={cn("w-full", className)}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export type AddressHistoryStepProps = {
  data: IntakeData;
  yearOptions: string[];
  onMailingSameAsPhysicalChange: (value: boolean) => void;
  onMailingAddressChange: (patch: Partial<AddressEntry>) => void;
  onUpdateAddress: (id: string, patch: Partial<AddressEntry>) => void;
  onAddAddress: () => void;
  onRemoveAddress: (id: string) => void;
};

export const AddressHistoryStepLegacy = ({
  data,
  yearOptions,
  onMailingSameAsPhysicalChange,
  onMailingAddressChange,
  onUpdateAddress,
  onAddAddress,
  onRemoveAddress,
}: AddressHistoryStepProps) => {
  const needsMailingAddress = data.mailingSameAsPhysical === false;

  return (
    <StepShell
      title="Address history (last 5 years)"
      description="Start with your current address and work backwards. It’s okay to estimate months."
    >
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <label className="flex flex-col gap-2 text-sm">
          <Label>
            Is your current mailing address the same as your physical address?
          </Label>
          {renderSelect(
            data.mailingSameAsPhysical ? "yes" : "no",
            (value) => onMailingSameAsPhysicalChange(value === "yes"),
            "Select",
            [
              { value: "yes", label: "Yes, they are the same" },
              { value: "no", label: "No, they are different" },
            ]
          )}
        </label>
      </div>

      {needsMailingAddress ? (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Mailing address
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          This is the address where you receive mail.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm sm:col-span-2">
            <Label>Street address</Label>
            <Input
              value={data.mailingAddress.street}
              onChange={(event) =>
                onMailingAddressChange({ street: event.target.value })
              }
              placeholder="123 Main St"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>Unit / Apt</Label>
            <Input
              value={data.mailingAddress.unit ?? ""}
              onChange={(event) =>
                onMailingAddressChange({ unit: event.target.value })
              }
              placeholder="Apt 2B"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>City</Label>
            <Input
              value={data.mailingAddress.city}
              onChange={(event) =>
                onMailingAddressChange({ city: event.target.value })
              }
              placeholder="San Jose"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>State</Label>
            {renderSelect(
              data.mailingAddress.state,
              (value) => onMailingAddressChange({ state: value }),
              "Select state",
              STATE_OPTIONS
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>ZIP / Postal code</Label>
            <Input
              value={data.mailingAddress.zip}
              onChange={(event) =>
                onMailingAddressChange({ zip: event.target.value })
              }
              placeholder="95112"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>Country</Label>
            <Input
              value={data.mailingAddress.country}
              onChange={(event) =>
                onMailingAddressChange({ country: event.target.value })
              }
              placeholder="United States"
            />
          </label>
        </div>
      </div>
      ) : null}

    {data.addresses.map((entry, idx) => (
      <div
        key={entry.id}
        className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {idx === 0 ? "Current address" : `Previous address ${idx}`}
          </p>
          {data.addresses.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveAddress(entry.id)}
            >
              Remove
            </Button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm sm:col-span-2">
            <Label>Street address</Label>
            <Input
              value={entry.street}
              onChange={(event) =>
                onUpdateAddress(entry.id, { street: event.target.value })
              }
              placeholder="123 Main St"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>Unit / Apt</Label>
            <Input
              value={entry.unit ?? ""}
              onChange={(event) =>
                onUpdateAddress(entry.id, { unit: event.target.value })
              }
              placeholder="Apt 2B"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>City</Label>
            <Input
              value={entry.city}
              onChange={(event) =>
                onUpdateAddress(entry.id, { city: event.target.value })
              }
              placeholder="San Jose"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>State</Label>
            {renderSelect(
              entry.state,
              (value) => onUpdateAddress(entry.id, { state: value }),
              "Select state",
              STATE_OPTIONS
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>ZIP / Postal code</Label>
            <Input
              value={entry.zip}
              onChange={(event) =>
                onUpdateAddress(entry.id, { zip: event.target.value })
              }
              placeholder="95112"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>Country</Label>
            <Input
              value={entry.country}
              onChange={(event) =>
                onUpdateAddress(entry.id, { country: event.target.value })
              }
              placeholder="United States"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm">
            <Label>From month</Label>
            {renderSelect(
              entry.startMonth,
              (value) => onUpdateAddress(entry.id, { startMonth: value as MonthValue }),
              "Month",
              MONTHS.map((month) => ({
                value: month.value,
                label: month.label,
              }))
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>From year</Label>
            {renderSelect(
              entry.startYear,
              (value) => onUpdateAddress(entry.id, { startYear: value }),
              "Year",
              yearOptions.map((year) => ({ value: year, label: year }))
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>To month</Label>
            {renderSelect(
              entry.endMonth ?? "",
              (value) => onUpdateAddress(entry.id, { endMonth: value as MonthValue }),
              "Month",
              MONTHS.map((month) => ({
                value: month.value,
                label: month.label,
              })),
              undefined,
              entry.isCurrent
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>To year</Label>
            {renderSelect(
              entry.endYear ?? "",
              (value) => onUpdateAddress(entry.id, { endYear: value }),
              "Year",
              yearOptions.map((year) => ({ value: year, label: year })),
              undefined,
              entry.isCurrent
            )}
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={entry.isCurrent}
              onChange={(event) =>
                onUpdateAddress(entry.id, {
                  isCurrent: event.target.checked,
                  endMonth: event.target.checked ? undefined : entry.endMonth,
                  endYear: event.target.checked ? undefined : entry.endYear,
                })
              }
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
            />
            <span>Current address</span>
          </label>
        </div>
      </div>
    ))}

      <Button type="button" variant="secondary" onClick={onAddAddress}>
        Add another address
      </Button>
    </StepShell>
  );
};
