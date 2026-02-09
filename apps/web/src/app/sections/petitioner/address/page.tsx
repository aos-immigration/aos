"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyAddress,
  loadIntake,
  saveIntake,
  type AddressEntry,
  type IntakeData,
  type MonthValue,
} from "@/app/lib/intakeStorage";
import { formatDateRange, getMonthOptions, getYearOptions } from "@/app/lib/dateUtils";
import { US_STATES } from "@/app/lib/constants";
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

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MONTHS = getMonthOptions();
const DEBOUNCE_MS = 400;

/* ------------------------------------------------------------------ */
/*  Reusable renderSelect (same pattern as IntakeFlow)                 */
/* ------------------------------------------------------------------ */

function renderSelect(
  value: string,
  onChange: (value: string) => void,
  placeholder: string,
  options: Array<{ value: string; label: string }>,
  className?: string,
  disabled?: boolean,
) {
  return (
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
}

/* ------------------------------------------------------------------ */
/*  AddressDisplayCard – read-only card in the timeline                */
/* ------------------------------------------------------------------ */

function AddressDisplayCard({
  address,
  onEdit,
  onRemove,
  showRemove = true,
}: {
  address: AddressEntry;
  onEdit: () => void;
  onRemove: () => void;
  showRemove?: boolean;
}) {
  const formattedAddress = [
    address.street?.trim(),
    address.unit?.trim() ? `Unit ${address.unit.trim()}` : null,
    address.city?.trim(),
    address.state?.trim(),
    address.zip?.trim(),
    address.country?.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const dateRange = formatDateRange(
    address.startMonth,
    address.startYear,
    address.endMonth,
    address.endYear,
  );

  return (
    <div className="group relative rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {address.isCurrent && (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Current
            </span>
          )}
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {formattedAddress || "Address incomplete"}
          </p>
          {dateRange && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {dateRange}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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

/* ------------------------------------------------------------------ */
/*  Inline AddressForm – used for both current and previous            */
/* ------------------------------------------------------------------ */

function InlineAddressForm({
  address,
  yearOptions,
  label,
  isCurrent: isCurrentProp,
  onUpdate,
  onDone,
  onCancel,
  showCancel,
}: {
  address: AddressEntry;
  yearOptions: string[];
  label: string;
  isCurrent: boolean;
  onUpdate: (patch: Partial<AddressEntry>) => void;
  onDone?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {label}
        </h3>
        {isCurrentProp && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
            Present
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Street */}
        <label className="flex flex-col gap-2 text-sm sm:col-span-2">
          <Label>Street address</Label>
          <Input
            value={address.street}
            onChange={(e) => onUpdate({ street: e.target.value })}
            placeholder="123 Main St"
          />
        </label>

        {/* Unit */}
        <label className="flex flex-col gap-2 text-sm">
          <Label>Unit / Apt</Label>
          <Input
            value={address.unit ?? ""}
            onChange={(e) => onUpdate({ unit: e.target.value })}
            placeholder="Apt 2B"
          />
        </label>

        {/* City */}
        <label className="flex flex-col gap-2 text-sm">
          <Label>City</Label>
          <Input
            value={address.city}
            onChange={(e) => onUpdate({ city: e.target.value })}
            placeholder="San Jose"
          />
        </label>

        {/* State */}
        <label className="flex flex-col gap-2 text-sm">
          <Label>State</Label>
          {renderSelect(
            address.state,
            (v) => onUpdate({ state: v }),
            "Select state",
            US_STATES.map((st) => ({ value: st, label: st })),
          )}
        </label>

        {/* ZIP */}
        <label className="flex flex-col gap-2 text-sm">
          <Label>ZIP Code</Label>
          <Input
            value={address.zip}
            onChange={(e) => onUpdate({ zip: e.target.value })}
            placeholder="95112"
          />
        </label>

        {/* Country */}
        <label className="flex flex-col gap-2 text-sm">
          <Label>Country</Label>
          <Input
            value={address.country}
            onChange={(e) => onUpdate({ country: e.target.value })}
            placeholder="United States"
          />
        </label>
      </div>

      {/* Date range */}
      <div className="grid gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-2 text-sm">
          <Label>Start month</Label>
          {renderSelect(
            address.startMonth,
            (v) => onUpdate({ startMonth: v as MonthValue }),
            "Month",
            MONTHS.map((m) => ({ value: m.value, label: m.label })),
          )}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <Label>Start year</Label>
          {renderSelect(
            address.startYear,
            (v) => onUpdate({ startYear: v }),
            "Year",
            yearOptions.map((y) => ({ value: y, label: y })),
          )}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <Label>End month</Label>
          {renderSelect(
            address.endMonth ?? "",
            (v) => onUpdate({ endMonth: v as MonthValue }),
            "Month",
            MONTHS.map((m) => ({ value: m.value, label: m.label })),
            undefined,
            address.isCurrent,
          )}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <Label>End year</Label>
          {renderSelect(
            address.endYear ?? "",
            (v) => onUpdate({ endYear: v }),
            "Year",
            yearOptions.map((y) => ({ value: y, label: y })),
            undefined,
            address.isCurrent,
          )}
        </label>
      </div>

      {/* Current checkbox */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={address.isCurrent}
            onChange={(e) =>
              onUpdate({
                isCurrent: e.target.checked,
                endMonth: e.target.checked ? undefined : address.endMonth,
                endYear: e.target.checked ? undefined : address.endYear,
              })
            }
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 dark:border-zinc-600"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Current address
          </span>
        </label>

        {(onDone || showCancel) && (
          <div className="flex gap-2">
            {showCancel && onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {onDone && (
              <Button type="button" size="sm" onClick={onDone}>
                Done
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mailing Address Form                                               */
/* ------------------------------------------------------------------ */

function MailingAddressForm({
  mailingAddress,
  onUpdate,
}: {
  mailingAddress: AddressEntry;
  onUpdate: (patch: Partial<AddressEntry>) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Mailing Address
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        This is the address where you receive mail.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm sm:col-span-2">
          <Label>Street address</Label>
          <Input
            value={mailingAddress.street}
            onChange={(e) => onUpdate({ street: e.target.value })}
            placeholder="123 Main St"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <Label>Unit / Apt</Label>
          <Input
            value={mailingAddress.unit ?? ""}
            onChange={(e) => onUpdate({ unit: e.target.value })}
            placeholder="Apt 2B"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <Label>City</Label>
          <Input
            value={mailingAddress.city}
            onChange={(e) => onUpdate({ city: e.target.value })}
            placeholder="San Jose"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <Label>State</Label>
          <Input
            value={mailingAddress.state}
            onChange={(e) => onUpdate({ state: e.target.value })}
            placeholder="CA"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <Label>ZIP / Postal code</Label>
          <Input
            value={mailingAddress.zip}
            onChange={(e) => onUpdate({ zip: e.target.value })}
            placeholder="95112"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <Label>Country</Label>
          <Input
            value={mailingAddress.country}
            onChange={(e) => onUpdate({ country: e.target.value })}
            placeholder="United States"
          />
        </label>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function PetitionerAddressPage() {
  const [data, setData] = useState<IntakeData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingPrevious, setAddingPrevious] = useState(false);
  const [draftAddress, setDraftAddress] = useState<AddressEntry | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const yearOptions = useMemo(() => getYearOptions(), []);

  // ---- Load on mount ----
  useEffect(() => {
    const loaded = loadIntake();
    // Ensure there is always at least one current address
    const hasCurrent = loaded.addresses.some((a) => a.isCurrent);
    if (loaded.addresses.length === 0 || !hasCurrent) {
      const initial = { ...createEmptyAddress(), isCurrent: true };
      const kept = loaded.addresses.filter((a) => a.street?.trim());
      loaded.addresses = [initial, ...kept];
    }
    setData(loaded);
  }, []);

  // ---- Debounced auto-save ----
  useEffect(() => {
    if (!data) return;
    setSaveStatus("saving");
    if (saveTimer.current) globalThis.clearTimeout(saveTimer.current);
    saveTimer.current = globalThis.setTimeout(() => {
      saveIntake(data);
      setSaveStatus("saved");
    }, DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) globalThis.clearTimeout(saveTimer.current);
    };
  }, [data]);

  // ---- Helpers ----
  const updateAddress = useCallback(
    (id: string, patch: Partial<AddressEntry>) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          addresses: prev.addresses.map((a) =>
            a.id === id ? { ...a, ...patch } : a,
          ),
        };
      });
    },
    [],
  );

  const removeAddress = useCallback((id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const remaining = prev.addresses.filter((a) => a.id !== id);
      return {
        ...prev,
        addresses:
          remaining.length > 0
            ? remaining
            : [{ ...createEmptyAddress(), isCurrent: true }],
      };
    });
    setEditingId(null);
  }, []);

  const handleStartAddPrevious = useCallback(() => {
    const newAddress: AddressEntry = {
      ...createEmptyAddress(),
      isCurrent: false,
    };
    setDraftAddress(newAddress);
    setAddingPrevious(true);
  }, []);

  const handleSaveDraft = useCallback(() => {
    if (!draftAddress) return;
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, addresses: [...prev.addresses, draftAddress] };
    });
    setDraftAddress(null);
    setAddingPrevious(false);
  }, [draftAddress]);

  const handleCancelDraft = useCallback(() => {
    setDraftAddress(null);
    setAddingPrevious(false);
  }, []);

  const updateMailingSameAsPhysical = useCallback((value: boolean) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, mailingSameAsPhysical: value };
    });
  }, []);

  const updateMailingAddress = useCallback((patch: Partial<AddressEntry>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mailingAddress: { ...prev.mailingAddress, ...patch },
      };
    });
  }, []);

  // ---- Derived ----
  if (!data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
      </div>
    );
  }

  const currentAddress = data.addresses.find((a) => a.isCurrent);
  const previousAddresses = data.addresses
    .filter((a) => !a.isCurrent)
    .sort((a, b) => {
      const aYear = parseInt(a.startYear || "0", 10);
      const bYear = parseInt(b.startYear || "0", 10);
      if (aYear !== bYear) return bYear - aYear;
      const aMonth = parseInt(a.startMonth || "0", 10);
      const bMonth = parseInt(b.startMonth || "0", 10);
      return bMonth - aMonth;
    });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* ── Header ── */}
      <div className="flex items-end justify-between border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Petitioner Address History
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            Provide your address history for the past 5&nbsp;years. Include all
            addresses where you have lived, even if temporary.
          </p>
        </div>
        <span
          className={cn(
            "text-xs transition-opacity",
            saveStatus === "saved"
              ? "text-emerald-600 dark:text-emerald-400 opacity-100"
              : "opacity-0",
          )}
        >
          ✓ Saved
        </span>
      </div>

      {/* ── Mailing address toggle ── */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <label className="flex flex-col gap-2 text-sm">
          <Label>
            Is your mailing address the same as your physical address?
          </Label>
          {renderSelect(
            data.mailingSameAsPhysical ? "yes" : "no",
            (v) => updateMailingSameAsPhysical(v === "yes"),
            "Select",
            [
              { value: "yes", label: "Yes, they are the same" },
              { value: "no", label: "No, they are different" },
            ],
          )}
        </label>
      </div>

      {/* ── Separate mailing address (if different) ── */}
      {!data.mailingSameAsPhysical && (
        <MailingAddressForm
          mailingAddress={data.mailingAddress}
          onUpdate={updateMailingAddress}
        />
      )}

      {/* ── Current Address ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Current Address
        </h2>

        {currentAddress && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            {editingId === currentAddress.id || !currentAddress.street ? (
              <InlineAddressForm
                address={currentAddress}
                yearOptions={yearOptions}
                label="Current Address"
                isCurrent
                onUpdate={(patch) => updateAddress(currentAddress.id, patch)}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <AddressDisplayCard
                address={currentAddress}
                onEdit={() => setEditingId(currentAddress.id)}
                onRemove={() => removeAddress(currentAddress.id)}
                showRemove={false}
              />
            )}
          </div>
        )}
      </section>

      {/* ── Previous Addresses ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Previous Addresses{" "}
          {previousAddresses.length > 0 && (
            <span className="ml-1 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
              {previousAddresses.length}
            </span>
          )}
        </h2>

        {previousAddresses.length === 0 && !addingPrevious && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No previous addresses added yet. Click below to add one.
            </p>
          </div>
        )}

        {/* Timeline connector */}
        <div className="relative space-y-4">
          {previousAddresses.length > 0 && (
            <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />
          )}

          {previousAddresses.map((address, idx) => {
            const isEditing = editingId === address.id;
            return (
              <div key={address.id} className="relative pl-12">
                {/* Timeline dot */}
                <div className="absolute left-[19px] top-5 h-3 w-3 rounded-full border-2 border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900" />

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  {isEditing ? (
                    <InlineAddressForm
                      address={address}
                      yearOptions={yearOptions}
                      label={`Previous Address ${idx + 1}`}
                      isCurrent={false}
                      onUpdate={(patch) => updateAddress(address.id, patch)}
                      onDone={() => setEditingId(null)}
                      onCancel={() => setEditingId(null)}
                      showCancel
                    />
                  ) : (
                    <AddressDisplayCard
                      address={address}
                      onEdit={() => setEditingId(address.id)}
                      onRemove={() => removeAddress(address.id)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Draft form for adding new previous address */}
        {addingPrevious && draftAddress && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <InlineAddressForm
              address={draftAddress}
              yearOptions={yearOptions}
              label={`Previous Address ${previousAddresses.length + 1}`}
              isCurrent={false}
              onUpdate={(patch) =>
                setDraftAddress((prev) => (prev ? { ...prev, ...patch } : prev))
              }
              onDone={handleSaveDraft}
              onCancel={handleCancelDraft}
              showCancel
            />
          </div>
        )}

        {/* Add button */}
        {!addingPrevious && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleStartAddPrevious}
            className="mt-2"
          >
            + Add Previous Address
          </Button>
        )}
      </section>
    </div>
  );
}
