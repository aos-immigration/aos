"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyAddress,
  createEmptyEmployment,
  defaultIntakeData,
  loadIntake,
  saveIntake,
  type AddressEntry,
  type EmploymentEntry,
  type IntakeData,
  type MonthValue,
} from "@/app/lib/intakeStorage";
import { getMonthOptions, getYearOptions } from "@/app/lib/dateUtils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StepShell } from "./StepShell";

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

const EmploymentEntryCard = ({
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

type AddressHistoryStepProps = {
  data: IntakeData;
  yearOptions: string[];
  onMailingSameAsPhysicalChange: (value: boolean) => void;
  onMailingAddressChange: (patch: Partial<AddressEntry>) => void;
  onUpdateAddress: (id: string, patch: Partial<AddressEntry>) => void;
  onAddAddress: () => void;
  onRemoveAddress: (id: string) => void;
};

const AddressHistoryStep = ({
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
            <Input
              value={data.mailingAddress.state}
              onChange={(event) =>
                onMailingAddressChange({ state: event.target.value })
              }
              placeholder="CA"
            />
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
            <Input
              value={entry.state}
              onChange={(event) =>
                onUpdateAddress(entry.id, { state: event.target.value })
              }
              placeholder="CA"
            />
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

const STEP_LABELS = [
  "Basics",
  "Contact",
  "Address history",
  "Employment history",
  "Review",
];

export function IntakeFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<IntakeData>(() => defaultIntakeData());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted data after hydration to avoid server/client mismatch.
  useEffect(() => {
    setData(loadIntake());
  }, []);

  useEffect(() => {
    if (saveTimer.current) {
      globalThis.clearTimeout(saveTimer.current);
    }
    saveTimer.current = globalThis.setTimeout(() => {
      saveIntake(data);
      setSaveStatus("saved");
    }, 400);

    return () => {
      if (saveTimer.current) {
        globalThis.clearTimeout(saveTimer.current);
      }
    };
  }, [data]);

  const yearOptions = useMemo(() => getYearOptions(), []);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        globalThis.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const goNext = () => {
    setStepIndex((prev) => Math.min(prev + 1, STEP_LABELS.length - 1));
  };
  const formatDob = () => {
    const { month, day, year } = data.basics.dateOfBirth;
    if (!month || !day || !year) {
      return "";
    }
    return `${month}/${day.padStart(2, "0")}/${year}`;
  };

  const formatMonthYear = (month: MonthValue, year: string) => {
    if (!month || !year) {
      return "";
    }
    return `${month}/${year}`;
  };

  const formatTimeline = (entry: {
    startMonth: MonthValue;
    startYear: string;
    endMonth?: MonthValue;
    endYear?: string;
    isCurrent: boolean;
  }) => {
    const start = formatMonthYear(entry.startMonth, entry.startYear);
    const end = entry.isCurrent
      ? "Present"
      : formatMonthYear(entry.endMonth ?? "", entry.endYear ?? "");
    if (!start && !end) {
      return "";
    }
    return `${start || "Unknown"} to ${end || "Unknown"}`;
  };

  const buildAdditionalInfo = () => {
    const physicalAddresses = data.mailingSameAsPhysical
      ? data.addresses.slice(1)
      : data.addresses;
    const overflowStart = data.mailingSameAsPhysical ? 1 : 2;
    const overflowAddresses = physicalAddresses.slice(overflowStart);
    const lines: string[] = [];

    overflowAddresses.forEach((entry, index) => {
      const address = [
        entry.street,
        entry.unit,
        entry.city,
        entry.state,
        entry.zip,
        entry.country,
      ]
        .filter(Boolean)
        .join(", ");
      const timeline = formatTimeline(entry);
      lines.push(
        `Part 2, Item 12-14 (Physical address history continued) ${index + 1}: ${
          address || "Address missing"
        } (${timeline || "Dates missing"})`
      );
    });

    return lines.join("\n");
  };

  const buildPdfPayload = () => {
    const relationshipMap: Record<string, string> = {
      spouse: "form1[0].#subform[0].Pt1Line1_Spouse[0]",
      parent: "form1[0].#subform[0].Pt1Line1_Parent[0]",
      child: "form1[0].#subform[0].Pt1Line1_Child[0]",
      sibling: "form1[0].#subform[0].Pt1Line1_Siblings[0]",
    };

    const mailingAddress = data.mailingSameAsPhysical
      ? data.addresses[0]
      : data.mailingAddress;
    const physicalAddresses = data.mailingSameAsPhysical
      ? data.addresses.slice(1)
      : data.addresses;
    const physicalAddress1 = data.mailingSameAsPhysical
      ? undefined
      : physicalAddresses[0];
    const physicalAddress2 = data.mailingSameAsPhysical
      ? physicalAddresses[0]
      : physicalAddresses[1];

    const addressFields = (
      entry: AddressEntry | undefined,
      prefix: string,
      include = true
    ) =>
      include
        ? {
            [`${prefix}_StreetNumberName[0]`]: entry?.street || "",
            [`${prefix}_AptSteFlrNumber[0]`]: entry?.unit || "",
            [`${prefix}_CityOrTown[0]`]: entry?.city || "",
            [`${prefix}_State[0]`]: entry?.state || "",
            [`${prefix}_ZipCode[0]`]: entry?.zip || "",
            [`${prefix}_PostalCode[0]`]: entry?.zip || "",
            [`${prefix}_Country[0]`]: entry?.country || "",
          }
        : {};

    const additionalInfo = buildAdditionalInfo();

    return {
      fields: {
        "form1[0].#subform[0].Pt2Line4a_FamilyName[0]":
          data.basics.petitioner.familyName,
        "form1[0].#subform[0].Pt2Line4b_GivenName[0]":
          data.basics.petitioner.givenName,
        "form1[0].#subform[0].Pt2Line4c_MiddleName[0]":
          data.basics.petitioner.middleName,
        "form1[0].#subform[1].Pt2Line8_DateofBirth[0]": formatDob(),
        ...addressFields(mailingAddress, "form1[0].#subform[1].Pt2Line10"),
        ...addressFields(
          physicalAddress1,
          "form1[0].#subform[1].Pt2Line12",
          !data.mailingSameAsPhysical
        ),
        ...addressFields(physicalAddress2, "form1[0].#subform[1].Pt2Line14"),
        "form1[0].#subform[11].Pt9Line3a_PageNumber[0]": additionalInfo
          ? "5"
          : "",
        "form1[0].#subform[11].Pt9Line3b_PartNumber[0]": additionalInfo
          ? "2"
          : "",
        "form1[0].#subform[11].Pt9Line3c_ItemNumber[0]": additionalInfo
          ? "10-14"
          : "",
        "form1[0].#subform[11].Pt9Line3d_AdditionalInfo[0]": additionalInfo,
      },
      checkboxes: {
        [relationshipMap[data.basics.relationship] ?? ""]: true,
        ...(data.mailingSameAsPhysical
          ? { "form1[0].#subform[1].Pt2Line11_Yes[0]": true }
          : { "form1[0].#subform[1].Pt2Line11_No[0]": true }),
      },
    };
  };

  const handleSave = () => {
    saveIntake(data);
    setSaveStatus("saved");
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const payload = buildPdfPayload();
      const response = await fetch(`${apiBase}/fill/i-130`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Failed to generate PDF (${response.status})`);
      }
      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      if (pdfUrl) {
        globalThis.URL.revokeObjectURL(pdfUrl);
      }
      setPdfUrl(url);
      setIsPreviewOpen(true);
    } finally {
      setIsGenerating(false);
    }
  };
  const goBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const updateAddress = (id: string, patch: Partial<AddressEntry>) => {
    setData((prev) => ({
      ...prev,
      addresses: prev.addresses.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry
      ),
    }));
  };

  const updateMailingSameAsPhysical = (value: boolean) => {
    setData((prev) => ({
      ...prev,
      mailingSameAsPhysical: value,
    }));
  };

  const updateMailingAddress = (patch: Partial<AddressEntry>) => {
    setData((prev) => ({
      ...prev,
      mailingAddress: {
        ...prev.mailingAddress,
        ...patch,
      },
    }));
  };

  const updateEmployment = (id: string, patch: Partial<EmploymentEntry>) => {
    setData((prev) => ({
      ...prev,
      employment: prev.employment.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry
      ),
    }));
  };

  const addAddress = () =>
    setData((prev) => ({
      ...prev,
      addresses: [...prev.addresses, createEmptyAddress()],
    }));

  const addEmployment = () =>
    setData((prev) => ({
      ...prev,
      employment: [...prev.employment, createEmptyEmployment()],
    }));

  const removeAddress = (id: string) =>
    setData((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((entry) => entry.id !== id),
    }));

  const removeEmployment = (id: string) =>
    setData((prev) => ({
      ...prev,
      employment: prev.employment.filter((entry) => entry.id !== id),
    }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
        {STEP_LABELS.map((label, idx) => (
          <div
            key={label}
            className={`rounded-full px-3 py-1 ${
              idx === stepIndex
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {stepIndex === 0 ? (
        <StepShell
          title="Let’s start with the basics"
          description="We’ll keep this short and friendly. You can edit anything later."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <Label>Relationship to beneficiary</Label>
              {renderSelect(
                data.basics.relationship,
                (value) =>
                  setData((prev) => ({
                    ...prev,
                    basics: {
                      ...prev.basics,
                      relationship: value as IntakeData["basics"]["relationship"],
                    },
                  })),
                "Select",
                [
                  { value: "spouse", label: "Spouse" },
                  { value: "parent", label: "Parent" },
                  { value: "child", label: "Child" },
                  { value: "sibling", label: "Brother/Sister" },
                ]
              )}
            </label>
            <div className="rounded-lg border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">
              We’ll use this to shape which I-130 questions you see.
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <Label>Given name</Label>
              <Input
                value={data.basics.petitioner.givenName}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    basics: {
                      ...prev.basics,
                      petitioner: {
                        ...prev.basics.petitioner,
                        givenName: event.target.value,
                      },
                    },
                  }))
                }
                placeholder="Alex"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <Label>Middle name</Label>
              <Input
                value={data.basics.petitioner.middleName}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    basics: {
                      ...prev.basics,
                      petitioner: {
                        ...prev.basics.petitioner,
                        middleName: event.target.value,
                      },
                    },
                  }))
                }
                placeholder="Leave blank if none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <Label>Family name</Label>
              <Input
                value={data.basics.petitioner.familyName}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    basics: {
                      ...prev.basics,
                      petitioner: {
                        ...prev.basics.petitioner,
                        familyName: event.target.value,
                      },
                    },
                  }))
                }
                placeholder="Doe"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <Label>Birth month</Label>
              {renderSelect(
                data.basics.dateOfBirth.month,
                (value) =>
                  setData((prev) => ({
                    ...prev,
                    basics: {
                      ...prev.basics,
                      dateOfBirth: {
                        ...prev.basics.dateOfBirth,
                        month: value as MonthValue,
                      },
                    },
                  })),
                "Month",
                MONTHS.map((month) => ({
                  value: month.value,
                  label: month.label,
                }))
              )}
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <Label>Birth day</Label>
              <Input
                inputMode="numeric"
                value={data.basics.dateOfBirth.day}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    basics: {
                      ...prev.basics,
                      dateOfBirth: {
                        ...prev.basics.dateOfBirth,
                        day: event.target.value,
                      },
                    },
                  }))
                }
                placeholder="DD"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <Label>Birth year</Label>
              <Input
                inputMode="numeric"
                value={data.basics.dateOfBirth.year}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    basics: {
                      ...prev.basics,
                      dateOfBirth: {
                        ...prev.basics.dateOfBirth,
                        year: event.target.value,
                      },
                    },
                  }))
                }
                placeholder="YYYY"
              />
            </label>
          </div>

        </StepShell>
      ) : null}

      {stepIndex === 1 ? (
        <StepShell
          title="How can we reach you?"
          description="We only ask for what’s needed for USCIS forms."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <Label>Email address</Label>
              <Input
                type="email"
                value={data.contact.email}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, email: event.target.value },
                  }))
                }
                placeholder="you@email.com"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <Label>Phone number</Label>
              <Input
                value={data.contact.phone}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, phone: event.target.value },
                  }))
                }
                placeholder="(555) 123-4567"
              />
            </label>
          </div>
        </StepShell>
      ) : null}

      {stepIndex === 2 ? (
        <AddressHistoryStep
          data={data}
          yearOptions={yearOptions}
          onMailingSameAsPhysicalChange={updateMailingSameAsPhysical}
          onMailingAddressChange={updateMailingAddress}
          onUpdateAddress={updateAddress}
          onAddAddress={addAddress}
          onRemoveAddress={removeAddress}
        />
      ) : null}

      {stepIndex === 3 ? (
        <StepShell
          title="Employment history (last 5 years)"
          description="Start with your current situation and work backwards."
        >
          {data.employment.map((entry, idx) => (
            <EmploymentEntryCard
              key={entry.id}
              entry={entry}
              index={idx}
              yearOptions={yearOptions}
              onUpdate={updateEmployment}
              onRemove={removeEmployment}
              showRemove={data.employment.length > 1}
            />
          ))}

          <Button type="button" variant="secondary" onClick={addEmployment}>
            Add another job or status
          </Button>
        </StepShell>
      ) : null}

      {stepIndex === 4 ? (
        <StepShell
          title="Quick review"
          description="We’ll highlight anything missing so you can fix it."
        >
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <p>
              Addresses entered: <strong>{data.addresses.length}</strong>
            </p>
            <p className="mt-1">
              Employment entries: <strong>{data.employment.length}</strong>
            </p>
            <p className="mt-2">
              We’ll flag timeline gaps and missing details once the mapping is
              connected to the PDF.
            </p>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <Label>Anything you want to revisit later?</Label>
            <Textarea
              value={data.addresses[0]?.notes || ""}
              onChange={(event) =>
                updateAddress(data.addresses[0].id, {
                  notes: event.target.value,
                })
              }
              placeholder="Optional notes for later..."
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSave}
              disabled={saveStatus === "saved"}
            >
              {saveStatus === "saved" ? "Saved" : "Save progress"}
            </Button>
            <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Preview PDF"}
            </Button>
          </div>

          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="flex h-[85vh] w-[90vw] max-w-6xl flex-col gap-4 p-6">
              <DialogHeader>
                <DialogTitle>PDF preview</DialogTitle>
                <DialogDescription>
                  First pass mapping from your intake answers.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800">
                {pdfUrl ? (
                  <iframe
                    title="I-130 preview"
                    src={pdfUrl}
                    className="h-full w-full"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Generate a preview to view the PDF.
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </StepShell>
      ) : null}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={stepIndex === 0}
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          {stepIndex < STEP_LABELS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={handleSave}>
              {saveStatus === "saved" ? "Saved" : "Save progress"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
