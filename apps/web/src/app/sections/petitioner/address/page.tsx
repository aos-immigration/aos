"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyAddress,
  createId,
  loadIntake,
  saveIntake,
  type AddressEntry,
  type IntakeData,
  type MonthValue,
} from "@/app/lib/intakeStorage";
import { getMonthOptions, getYearOptions } from "@/app/lib/dateUtils";
import { US_STATES } from "@/app/lib/constants";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const MONTHS = getMonthOptions();

const US_STATES_WITH_LABELS: { value: string; label: string }[] = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
  { value: "PR", label: "Puerto Rico" },
  { value: "VI", label: "U.S. Virgin Islands" },
  { value: "GU", label: "Guam" },
  { value: "AS", label: "American Samoa" },
  { value: "MP", label: "Northern Mariana Islands" },
];

/* ------------------------------------------------------------------ */
/*  Small UI helpers                                                  */
/* ------------------------------------------------------------------ */

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400",
        className,
      )}
    >
      {children}
    </span>
  );
}

function SectionHeader({
  title,
  badges,
}: {
  title: string;
  badges: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {badges.map((b) => (
        <Badge key={b}>{b}</Badge>
      ))}
    </div>
  );
}

function renderSelect(
  value: string,
  onChange: (v: string) => void,
  placeholder: string,
  options: { value: string; label: string }[],
  className?: string,
  disabled?: boolean,
) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled ?? false}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------------------------------------------ */
/*  Address fields sub-component                                      */
/* ------------------------------------------------------------------ */

type AddressFieldsProps = {
  address: AddressEntry;
  onChange: (patch: Partial<AddressEntry>) => void;
  showDates?: boolean;
  showEndDate?: boolean;
  prefix: string;
};

function AddressFields({
  address,
  onChange,
  showDates = true,
  showEndDate = false,
  prefix,
}: AddressFieldsProps) {
  const yearOptions = useMemo(() => getYearOptions(), []);

  return (
    <div className="space-y-4">
      {/* Street, Unit, City, State, Zip, Country */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-2 text-sm sm:col-span-2 lg:col-span-2">
          <Label htmlFor={`${prefix}-street`}>Street Number & Name</Label>
          <Input
            id={`${prefix}-street`}
            value={address.street}
            onChange={(e) => onChange({ street: e.target.value })}
            placeholder="123 Main St"
          />
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <Label htmlFor={`${prefix}-unit`}>Apt / Ste / Flr</Label>
          <Input
            id={`${prefix}-unit`}
            value={address.unit ?? ""}
            onChange={(e) => onChange({ unit: e.target.value })}
            placeholder="Apt 2B"
          />
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <Label htmlFor={`${prefix}-city`}>City</Label>
          <Input
            id={`${prefix}-city`}
            value={address.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="San Jose"
          />
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <Label>State</Label>
          {renderSelect(
            address.state,
            (v) => onChange({ state: v }),
            "Select state",
            US_STATES_WITH_LABELS,
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <Label htmlFor={`${prefix}-zip`}>ZIP Code</Label>
          <Input
            id={`${prefix}-zip`}
            value={address.zip}
            onChange={(e) => onChange({ zip: e.target.value })}
            placeholder="95112"
          />
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <Label htmlFor={`${prefix}-country`}>Country</Label>
          <Input
            id={`${prefix}-country`}
            value={address.country}
            onChange={(e) => onChange({ country: e.target.value })}
            placeholder="United States"
          />
        </div>
      </div>

      {/* Date fields */}
      {showDates && (
        <div className={cn("grid gap-4", showEndDate ? "sm:grid-cols-4" : "sm:grid-cols-2")}>
          <div className="flex flex-col gap-2 text-sm">
            <Label>Date From (Month)</Label>
            {renderSelect(
              address.startMonth,
              (v) => onChange({ startMonth: v as MonthValue }),
              "Month",
              MONTHS.map((m) => ({ value: m.value, label: m.label })),
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Label>Date From (Year)</Label>
            {renderSelect(
              address.startYear,
              (v) => onChange({ startYear: v }),
              "Year",
              yearOptions.map((y) => ({ value: y, label: y })),
            )}
          </div>
          {showEndDate && (
            <>
              <div className="flex flex-col gap-2 text-sm">
                <Label>Date To (Month)</Label>
                {renderSelect(
                  address.endMonth ?? "",
                  (v) => onChange({ endMonth: v as MonthValue }),
                  "Month",
                  MONTHS.map((m) => ({ value: m.value, label: m.label })),
                )}
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <Label>Date To (Year)</Label>
                {renderSelect(
                  address.endYear ?? "",
                  (v) => onChange({ endYear: v }),
                  "Year",
                  yearOptions.map((y) => ({ value: y, label: y })),
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PDF payload builder (self-contained, mirrors IntakeFlow logic)    */
/* ------------------------------------------------------------------ */

function buildAddressPdfPayload(data: IntakeData) {
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
    include = true,
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

  const formatMonthYear = (month: string, year: string) => {
    if (!month || !year) return "";
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
    if (!start && !end) return "";
    return `${start || "Unknown"} to ${end || "Unknown"}`;
  };

  // Build additional info for overflow addresses
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
      } (${timeline || "Dates missing"})`,
    );
  });

  const additionalInfo = lines.join("\n");

  return {
    fields: {
      ...addressFields(mailingAddress, "form1[0].#subform[1].Pt2Line10"),
      ...addressFields(
        physicalAddress1,
        "form1[0].#subform[1].Pt2Line12",
        !data.mailingSameAsPhysical,
      ),
      ...addressFields(physicalAddress2, "form1[0].#subform[1].Pt2Line14"),
      "form1[0].#subform[11].Pt9Line3a_PageNumber[0]": additionalInfo ? "5" : "",
      "form1[0].#subform[11].Pt9Line3b_PartNumber[0]": additionalInfo ? "2" : "",
      "form1[0].#subform[11].Pt9Line3c_ItemNumber[0]": additionalInfo ? "10-14" : "",
      "form1[0].#subform[11].Pt9Line3d_AdditionalInfo[0]": additionalInfo,
    },
    checkboxes: {
      ...(data.mailingSameAsPhysical
        ? { "form1[0].#subform[1].Pt2Line11_Yes[0]": true }
        : { "form1[0].#subform[1].Pt2Line11_No[0]": true }),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Main page component                                               */
/* ------------------------------------------------------------------ */

export default function PetitionerAddressPage() {
  /* ---- state ---- */
  const [data, setData] = useState<IntakeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- load data on mount ---- */
  useEffect(() => {
    setData(loadIntake());
  }, []);

  /* ---- debounced auto-save ---- */
  useEffect(() => {
    if (!data) return;
    setSaveStatus("saving");
    if (saveTimer.current) globalThis.clearTimeout(saveTimer.current);
    saveTimer.current = globalThis.setTimeout(() => {
      saveIntake(data);
      setSaveStatus("saved");
    }, 500);
    return () => {
      if (saveTimer.current) globalThis.clearTimeout(saveTimer.current);
    };
  }, [data]);

  /* ---- revoke pdf blob on unmount ---- */
  useEffect(() => {
    return () => {
      if (pdfUrl) globalThis.URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  /* ---- helpers to update state ---- */
  const updateMailingAddress = useCallback((patch: Partial<AddressEntry>) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, mailingAddress: { ...prev.mailingAddress, ...patch } };
    });
  }, []);

  const updateMailingSameAsPhysical = useCallback((value: boolean) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, mailingSameAsPhysical: value };
    });
  }, []);

  const updateAddress = useCallback((id: string, patch: Partial<AddressEntry>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        addresses: prev.addresses.map((entry) =>
          entry.id === id ? { ...entry, ...patch } : entry,
        ),
      };
    });
  }, []);

  const addPreviousAddress = useCallback(() => {
    setData((prev) => {
      if (!prev) return prev;
      const newAddr = { ...createEmptyAddress(), isCurrent: false };
      return { ...prev, addresses: [...prev.addresses, newAddr] };
    });
  }, []);

  const removePreviousAddress = useCallback((id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const filtered = prev.addresses.filter((a) => a.id !== id);
      return { ...prev, addresses: filtered.length > 0 ? filtered : [createEmptyAddress()] };
    });
  }, []);

  /* ---- PDF generation ---- */
  const handleVerifyPdf = useCallback(async () => {
    if (!data) return;
    setIsGenerating(true);
    setPdfError(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const payload = buildAddressPdfPayload(data);
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
      if (pdfUrl) globalThis.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
      setIsPreviewOpen(true);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsGenerating(false);
    }
  }, [data, pdfUrl]);

  const handleDialogClose = useCallback(
    (open: boolean) => {
      setIsPreviewOpen(open);
      if (!open && pdfUrl) {
        globalThis.URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    },
    [pdfUrl],
  );

  /* ---- derive previous addresses ---- */
  const currentPhysicalAddress = data?.addresses[0];
  const previousAddresses = data?.addresses.slice(1) ?? [];

  /* ---- loading state ---- */
  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">Loading address data…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* ---- Page header ---- */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Petitioner Address History
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Provide your address history for the past 5 years. This data maps to
            the I-130 petition form (Part 2, Items 10–14).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "saved" && (
            <span className="text-xs text-emerald-500">✓ Saved</span>
          )}
          {saveStatus === "saving" && (
            <span className="text-xs text-muted-foreground">Saving…</span>
          )}
          <Button
            onClick={handleVerifyPdf}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Verify PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ---- PDF error ---- */}
      {pdfError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <strong>Error:</strong> {pdfError}
        </div>
      )}

      {/* ---- Section 1: Current Mailing Address ---- */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <SectionHeader
          title="Current Mailing Address"
          badges={["I-130 Pt.2 #10"]}
        />
        <p className="text-sm text-muted-foreground">
          The address where you currently receive mail.
        </p>
        <AddressFields
          address={
            data.mailingSameAsPhysical
              ? (currentPhysicalAddress ?? data.mailingAddress)
              : data.mailingAddress
          }
          onChange={(patch) => {
            if (data.mailingSameAsPhysical) {
              // When same, mailing IS the first physical address
              if (currentPhysicalAddress) {
                updateAddress(currentPhysicalAddress.id, patch);
              }
            } else {
              updateMailingAddress(patch);
            }
          }}
          showDates
          showEndDate={false}
          prefix="mailing"
        />
      </section>

      {/* ---- Section 2: Same as Physical toggle ---- */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <SectionHeader
          title="Mailing Same as Physical?"
          badges={["I-130 Pt.2 #11"]}
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-3 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={data.mailingSameAsPhysical}
              onChange={(e) => updateMailingSameAsPhysical(e.target.checked)}
              className="h-5 w-5 rounded border-border text-blue-500 focus:ring-blue-500"
            />
            <span>
              Yes, my mailing address is the same as my physical address
            </span>
          </label>
        </div>
        {data.mailingSameAsPhysical && (
          <p className="text-xs text-muted-foreground">
            Your current mailing address above will also be used as your physical
            address on the form.
          </p>
        )}
      </section>

      {/* ---- Section 3: Current Physical Address (shown only when NOT same) ---- */}
      {!data.mailingSameAsPhysical && (
        <section className="rounded-lg border border-border bg-card p-6 space-y-4">
          <SectionHeader
            title="Current Physical Address"
            badges={["I-130 Pt.2 #12"]}
          />
          <p className="text-sm text-muted-foreground">
            The address where you physically reside (different from mailing).
          </p>
          {currentPhysicalAddress ? (
            <AddressFields
              address={currentPhysicalAddress}
              onChange={(patch) =>
                updateAddress(currentPhysicalAddress.id, patch)
              }
              showDates
              showEndDate={false}
              prefix="physical"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No physical address found. Add one below.
            </p>
          )}
        </section>
      )}

      {/* ---- Section 4: Previous Addresses ---- */}
      <section className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-6 space-y-2">
          <SectionHeader
            title="Previous Physical Addresses (Last 5 Years)"
            badges={["I-130 Pt.2 #14", "I-130 Supplement"]}
          />
          <p className="text-sm text-muted-foreground">
            List all addresses where you have lived in the last 5 years, starting
            with the most recent.
          </p>
        </div>

        {previousAddresses.map((entry, idx) => (
          <div
            key={entry.id}
            className="rounded-lg border border-border bg-card p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-foreground">
                  Previous Address {idx + 1}
                </h3>
                <Badge className={idx === 0 ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}>
                  {idx === 0 ? "I-130 Pt.2 #14" : "I-130 Supplement"}
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePreviousAddress(entry.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Remove
              </Button>
            </div>
            <AddressFields
              address={entry}
              onChange={(patch) => updateAddress(entry.id, patch)}
              showDates
              showEndDate
              prefix={`prev-${idx}`}
            />
          </div>
        ))}

        <Button type="button" variant="secondary" onClick={addPreviousAddress}>
          + Add Previous Address
        </Button>
      </section>

      {/* ---- Bottom Verify PDF button ---- */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          onClick={handleVerifyPdf}
          disabled={isGenerating}
          size="lg"
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating PDF…
            </>
          ) : (
            "Verify PDF"
          )}
        </Button>
      </div>

      {/* ---- PDF Preview Dialog ---- */}
      <Dialog open={isPreviewOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>I-130 PDF Preview</DialogTitle>
            <DialogDescription>
              Verify that the address fields are correctly mapped on the I-130
              form.
            </DialogDescription>
          </DialogHeader>
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              title="I-130 PDF preview"
              className="w-full h-[85vh] rounded-md border border-border"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
