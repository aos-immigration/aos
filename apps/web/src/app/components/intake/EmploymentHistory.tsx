"use client";

import React, { useMemo } from "react";
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
import {
  type EmploymentEntry,
  type MonthValue,
  createEmptyEmployment,
} from "@/app/lib/intakeStorage";
import { getMonthOptions, getYearOptions } from "@/app/lib/dateUtils";

const MONTHS = getMonthOptions();

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

type EmploymentEntryCardProps = {
  entry: EmploymentEntry;
  index: number;
  yearOptions: string[];
  onUpdate: (id: string, patch: Partial<EmploymentEntry>) => void;
  onRemove: (id: string) => void;
  showRemove: boolean;
};

export const EmploymentEntryCard = ({
  entry,
  index,
  yearOptions,
  onUpdate,
  onRemove,
  showRemove,
}: EmploymentEntryCardProps) => (
  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {index === 0 ? "Current employment" : `Previous employment ${index}`}
      </p>
      {showRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(entry.id)}
        >
          Remove
        </Button>
      ) : null}
    </div>

    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-2 text-sm">
        <Label>Status</Label>
        {renderSelect(
          entry.status,
          (value) =>
            onUpdate(entry.id, {
              status: value as EmploymentEntry["status"],
            }),
          "Select",
          [
            { value: "employed", label: "Employed" },
            { value: "unemployed", label: "Unemployed" },
            { value: "student", label: "Student" },
            { value: "other", label: "Other" },
          ]
        )}
      </label>
      {entry.status === "employed" ? (
        <>
          <label className="flex flex-col gap-2 text-sm">
            <Label>Employer name</Label>
            <Input
              value={entry.employerName}
              onChange={(event) =>
                onUpdate(entry.id, {
                  employerName: event.target.value,
                })
              }
              placeholder="Company name"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>Job title</Label>
            <Input
              value={entry.jobTitle}
              onChange={(event) =>
                onUpdate(entry.id, { jobTitle: event.target.value })
              }
              placeholder="Software Engineer"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>City</Label>
            <Input
              value={entry.city}
              onChange={(event) => onUpdate(entry.id, { city: event.target.value })}
              placeholder="San Jose"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>State</Label>
            <Input
              value={entry.state}
              onChange={(event) => onUpdate(entry.id, { state: event.target.value })}
              placeholder="CA"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <Label>Country</Label>
            <Input
              value={entry.country}
              onChange={(event) =>
                onUpdate(entry.id, { country: event.target.value })
              }
              placeholder="United States"
            />
          </label>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">
          Employer details only appear when your status is Employed.
        </div>
      )}
    </div>

    <div className="mt-4 grid gap-4 sm:grid-cols-4">
      <label className="flex flex-col gap-2 text-sm">
        <Label>From month</Label>
        {renderSelect(
          entry.fromMonth,
          (value) =>
            onUpdate(entry.id, {
              fromMonth: value as MonthValue,
            }),
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
          entry.fromYear,
          (value) => onUpdate(entry.id, { fromYear: value }),
          "Year",
          yearOptions.map((year) => ({ value: year, label: year }))
        )}
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <Label>To month</Label>
        {renderSelect(
          entry.toMonth,
          (value) => onUpdate(entry.id, { toMonth: value as MonthValue }),
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
          entry.toYear,
          (value) => onUpdate(entry.id, { toYear: value }),
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
            onUpdate(entry.id, {
              isCurrent: event.target.checked,
              toMonth: event.target.checked ? "" : entry.toMonth,
              toYear: event.target.checked ? "" : entry.toYear,
            })
          }
          className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
        />
        <span>Current situation</span>
      </label>
    </div>
  </div>
);

export type EmploymentHistoryProps = {
  employment: EmploymentEntry[];
  onChange: (employment: EmploymentEntry[]) => void;
};

export function EmploymentHistory({ employment, onChange }: EmploymentHistoryProps) {
  const yearOptions = useMemo(() => getYearOptions(), []);

  const updateEmployment = (id: string, patch: Partial<EmploymentEntry>) => {
    const newEmployment = employment.map((entry) =>
      entry.id === id ? { ...entry, ...patch } : entry
    );
    onChange(newEmployment);
  };

  const addEmployment = () => {
    const newEmployment = [...employment, createEmptyEmployment()];
    onChange(newEmployment);
  };

  const removeEmployment = (id: string) => {
    const newEmployment = employment.filter((entry) => entry.id !== id);
    if (newEmployment.length === 0) {
      onChange([createEmptyEmployment()]);
    } else {
      onChange(newEmployment);
    }
  };

  return (
    <div className="space-y-6">
      {employment.map((entry, idx) => (
        <EmploymentEntryCard
          key={entry.id}
          entry={entry}
          index={idx}
          yearOptions={yearOptions}
          onUpdate={updateEmployment}
          onRemove={removeEmployment}
          showRemove={employment.length > 1}
        />
      ))}

      <Button type="button" variant="secondary" onClick={addEmployment}>
        Add another job or status
      </Button>
    </div>
  );
}
