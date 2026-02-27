"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
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
import { employmentSchema, employmentBaseSchema } from "@/app/lib/schemas/employmentSchema";
import type { z } from "zod";

type EmploymentFormInput = z.input<typeof employmentBaseSchema>;
import { getMonthOptions, getYearOptions, formatDateRange } from "@/app/lib/dateUtils";
import { US_STATES } from "@/app/lib/constants";

type EmploymentHistoryProps = {
  applicationId: Id<"applications">;
};

type EmploymentEntry = {
  _id: Id<"employmentEntries">;
  status: string;
  employerName: string;
  jobTitle: string;
  employerAddress?: string;
  city?: string;
  state?: string;
  country: string;
  fromMonth: string;
  fromYear: string;
  toMonth?: string;
  toYear?: string;
  isCurrent: boolean;
  sortOrder: number;
};

const STATUS_OPTIONS = [
  { value: "employed", label: "Employed" },
  { value: "unemployed", label: "Unemployed" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
] as const;

function createEmptyFormData(isCurrent: boolean): EmploymentFormInput {
  return {
    id: crypto.randomUUID(),
    status: "employed",
    employerName: "",
    jobTitle: "",
    city: "",
    state: "",
    country: "United States",
    fromMonth: "",
    fromYear: "",
    toMonth: "",
    toYear: "",
    isCurrent,
    notes: "",
  };
}

// ── Employment Form ──

type EmploymentFormProps = {
  defaultValues: EmploymentFormInput;
  entryId?: Id<"employmentEntries">;
  applicationId: Id<"applications">;
  onSaved: () => void;
  onCancel?: () => void;
  isCurrent: boolean;
};

function EmploymentForm({
  defaultValues,
  entryId,
  applicationId,
  onSaved,
  onCancel,
  isCurrent,
}: EmploymentFormProps) {
  const months = getMonthOptions();
  const years = getYearOptions();
  const saveEntry = useMutation(api.petitioner.saveEmploymentEntry);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmploymentFormInput>({
    resolver: zodResolver(employmentSchema),
    defaultValues,
  });

  const statusValue = watch("status");
  const fromMonthValue = watch("fromMonth");
  const fromYearValue = watch("fromYear");
  const toMonthValue = watch("toMonth");
  const toYearValue = watch("toYear");
  const stateValue = watch("state");

  const onSubmit = async (data: EmploymentFormInput) => {
    await saveEntry({
      _id: entryId,
      applicationId,
      personRole: "petitioner",
      status: data.status,
      employerName: data.employerName || "",
      jobTitle: data.jobTitle || "",
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || "United States",
      fromMonth: data.fromMonth,
      fromYear: data.fromYear,
      toMonth: data.isCurrent ? undefined : data.toMonth || undefined,
      toYear: data.isCurrent ? undefined : data.toYear || undefined,
      isCurrent: data.isCurrent,
      sortOrder: 0,
    });
    onSaved();
  };

  const isEmployed = statusValue === "employed";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {isCurrent ? "Current Employment" : "Previous Employment"}
        </h3>
        {isCurrent && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            Present
          </span>
        )}
      </div>

      <div className="grid gap-4">
        {/* Status */}
        <div className="flex flex-col gap-2 text-sm">
          <Label>Employment Status</Label>
          <Select
            value={statusValue}
            onValueChange={(v) => setValue("status", v as EmploymentFormInput["status"], { shouldValidate: true })}
          >
            <SelectTrigger aria-invalid={!!errors.status}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.status && <span className="text-xs text-red-500">{errors.status.message}</span>}
        </div>
        {/* Employer details (shown when employed) */}
        {isEmployed && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 text-sm">
              <Label htmlFor="employerName">Employer Name</Label>
              <Input
                id="employerName"
                {...register("employerName")}
                placeholder="Company Name"
                aria-invalid={!!errors.employerName}
              />
              {errors.employerName && (
                <span className="text-xs text-red-500">{errors.employerName.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                {...register("jobTitle")}
                placeholder="Software Engineer"
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} placeholder="San Jose" />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <Label>State</Label>
              <Select
                value={stateValue || undefined}
                onValueChange={(v) => setValue("state", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((st) => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...register("country")}
                placeholder="United States"
              />
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 text-sm">
            <Label>From Month</Label>
            <Select
              value={fromMonthValue || undefined}
              onValueChange={(v) => setValue("fromMonth", v, { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.fromMonth}>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fromMonth && (
              <span className="text-xs text-red-500">{errors.fromMonth.message}</span>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Label>From Year</Label>
            <Select
              value={fromYearValue || undefined}
              onValueChange={(v) => setValue("fromYear", v, { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.fromYear}>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fromYear && (
              <span className="text-xs text-red-500">{errors.fromYear.message}</span>
            )}
          </div>

          {!isCurrent && (
            <>
              <div className="flex flex-col gap-2 text-sm">
                <Label>To Month</Label>
                <Select
                  value={toMonthValue || undefined}
                  onValueChange={(v) => setValue("toMonth", v, { shouldValidate: true })}
                >
                  <SelectTrigger aria-invalid={!!errors.toMonth}>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.toMonth && (
                  <span className="text-xs text-red-500">{errors.toMonth.message}</span>
                )}
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <Label>To Year</Label>
                <Select
                  value={toYearValue || undefined}
                  onValueChange={(v) => setValue("toYear", v, { shouldValidate: true })}
                >
                  <SelectTrigger aria-invalid={!!errors.toYear}>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.toYear && (
                  <span className="text-xs text-red-500">{errors.toYear.message}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

// ── Employment Card ──

function EmploymentCard({
  entry,
  onEdit,
  onRemove,
}: {
  entry: EmploymentEntry;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const details = [
    entry.employerName,
    entry.jobTitle,
    [entry.city, entry.state].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");

  const dateRange = formatDateRange(
    entry.fromMonth,
    entry.fromYear,
    entry.toMonth,
    entry.toYear
  );

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === entry.status)?.label ?? entry.status;

  return (
    <div className="group relative rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {entry.isCurrent && (
            <span className="mb-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              Current
            </span>
          )}
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {details || statusLabel}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {dateRange || "Dates not specified"}
          </p>
          {entry.status !== "employed" && (
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Status: {statusLabel}
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
          {!entry.isCurrent && (
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

// ── Main Component ──

export function EmploymentHistory({ applicationId }: EmploymentHistoryProps) {
  const entries = useQuery(api.petitioner.listEmploymentEntries, {
    applicationId,
    personRole: "petitioner",
  });
  const removeEntry = useMutation(api.petitioner.removeEmploymentEntry);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingPrevious, setIsAddingPrevious] = useState(false);

  if (entries === undefined) {
    return <div className="text-sm text-muted-foreground">Loading employment history...</div>;
  }

  const currentEntry = entries.find((e) => e.isCurrent);
  const previousEntries = entries
    .filter((e) => !e.isCurrent)
    .sort((a, b) => {
      const aYear = parseInt(a.fromYear || "0", 10);
      const bYear = parseInt(b.fromYear || "0", 10);
      if (aYear !== bYear) return bYear - aYear;
      const aMonth = parseInt(a.fromMonth || "0", 10);
      const bMonth = parseInt(b.fromMonth || "0", 10);
      return bMonth - aMonth;
    });

  const isEditingCurrent = editingId === currentEntry?._id;
  const showCurrentForm = !currentEntry || isEditingCurrent;

  function entryToFormData(entry: EmploymentEntry): EmploymentFormInput {
    return {
      id: entry._id,
      status: entry.status as EmploymentFormInput["status"],
      employerName: entry.employerName || "",
      jobTitle: entry.jobTitle || "",
      city: entry.city || "",
      state: entry.state || "",
      country: entry.country || "United States",
      fromMonth: entry.fromMonth || "",
      fromYear: entry.fromYear || "",
      toMonth: entry.toMonth || "",
      toYear: entry.toYear || "",
      isCurrent: entry.isCurrent,
      notes: "",
    };
  }

  return (
    <div className="space-y-6">
      {/* Current Employment */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {showCurrentForm ? (
          <EmploymentForm
            defaultValues={
              currentEntry
                ? entryToFormData(currentEntry)
                : createEmptyFormData(true)
            }
            entryId={currentEntry?._id}
            applicationId={applicationId}
            onSaved={() => setEditingId(null)}
            onCancel={currentEntry && isEditingCurrent ? () => setEditingId(null) : undefined}
            isCurrent={true}
          />
        ) : (
          <EmploymentCard
            entry={currentEntry}
            onEdit={() => setEditingId(currentEntry._id)}
            onRemove={() => removeEntry({ id: currentEntry._id })}
          />
        )}
      </div>

      {/* Previous Employment */}
      {previousEntries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Previous Employment ({previousEntries.length})
          </h3>
          {previousEntries.map((entry) => {
            const isEditing = editingId === entry._id;
            return (
              <div
                key={entry._id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {isEditing ? (
                  <EmploymentForm
                    defaultValues={entryToFormData(entry)}
                    entryId={entry._id}
                    applicationId={applicationId}
                    onSaved={() => setEditingId(null)}
                    onCancel={() => setEditingId(null)}
                    isCurrent={false}
                  />
                ) : (
                  <EmploymentCard
                    entry={entry}
                    onEdit={() => setEditingId(entry._id)}
                    onRemove={() => removeEntry({ id: entry._id })}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Previous Form */}
      {isAddingPrevious && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <EmploymentForm
            defaultValues={createEmptyFormData(false)}
            applicationId={applicationId}
            onSaved={() => setIsAddingPrevious(false)}
            onCancel={() => setIsAddingPrevious(false)}
            isCurrent={false}
          />
        </div>
      )}

      {!isAddingPrevious && (
        <Button type="button" variant="secondary" onClick={() => setIsAddingPrevious(true)}>
          Add Previous Employer
        </Button>
      )}
    </div>
  );
}

