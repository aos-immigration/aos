"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AddressEntry } from "@/app/lib/intakeStorage";
import { getMonthOptions, getYearOptions } from "@/app/lib/dateUtils";
import type { ValidationErrors } from "@/app/lib/addressValidation";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC", "PR", "VI", "GU", "AS", "MP",
];

type AddressFormProps = {
  address: AddressEntry;
  onChange: (address: AddressEntry) => void;
  errors?: ValidationErrors;
  showEndDate?: boolean;
  disabled?: boolean;
};

export function AddressForm({
  address,
  onChange,
  errors = {},
  showEndDate = true,
  disabled = false,
}: AddressFormProps) {
  const months = getMonthOptions();
  const years = getYearOptions();

  const handleChange = (field: keyof AddressEntry, value: string) => {
    onChange({ ...address, [field]: value });
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm sm:col-span-2">
          <Label>Street address</Label>
          <Input
            value={address.street}
            onChange={(e) => handleChange("street", e.target.value)}
            placeholder="123 Main St"
            disabled={disabled}
            aria-invalid={!!errors.street}
          />
          {errors.street && (
            <span className="text-xs text-red-500" role="alert">
              {errors.street}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <Label>Unit / Apt</Label>
          <Input
            value={address.unit ?? ""}
            onChange={(e) => handleChange("unit", e.target.value)}
            placeholder="Apt 2B"
            disabled={disabled}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <Label>City</Label>
          <Input
            value={address.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="San Jose"
            disabled={disabled}
            aria-invalid={!!errors.city}
          />
          {errors.city && (
            <span className="text-xs text-red-500" role="alert">
              {errors.city}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <Label>State</Label>
          <Select
            value={address.state || undefined}
            onValueChange={(v) => handleChange("state", v)}
            disabled={disabled}
          >
            <SelectTrigger aria-invalid={!!errors.state}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((st) => (
                <SelectItem key={st} value={st}>
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <span className="text-xs text-red-500" role="alert">
              {errors.state}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <Label>ZIP Code</Label>
          <Input
            value={address.zip}
            onChange={(e) => handleChange("zip", e.target.value)}
            placeholder="95112"
            disabled={disabled}
            aria-invalid={!!errors.zip}
          />
          {errors.zip && (
            <span className="text-xs text-red-500" role="alert">
              {errors.zip}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <Label>Country</Label>
          <Input
            value={address.country}
            onChange={(e) => handleChange("country", e.target.value)}
            placeholder="United States"
            disabled={disabled}
            aria-invalid={!!errors.country}
          />
          {errors.country && (
            <span className="text-xs text-red-500" role="alert">
              {errors.country}
            </span>
          )}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-2 text-sm">
          <Label>Start month</Label>
          <Select
            value={address.startMonth || undefined}
            onValueChange={(v) => handleChange("startMonth", v)}
            disabled={disabled}
          >
            <SelectTrigger aria-invalid={!!errors.startMonth}>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.startMonth && (
            <span className="text-xs text-red-500" role="alert">
              {errors.startMonth}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <Label>Start year</Label>
          <Select
            value={address.startYear || undefined}
            onValueChange={(v) => handleChange("startYear", v)}
            disabled={disabled}
          >
            <SelectTrigger aria-invalid={!!errors.startYear}>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.startYear && (
            <span className="text-xs text-red-500" role="alert">
              {errors.startYear}
            </span>
          )}
        </label>

        {showEndDate && (
          <>
            <label className="flex flex-col gap-2 text-sm">
              <Label>End month</Label>
              <Select
                value={address.endMonth || undefined}
                onValueChange={(v) => handleChange("endMonth", v)}
                disabled={disabled || address.isCurrent}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <Label>End year</Label>
              <Select
                value={address.endYear || undefined}
                onValueChange={(v) => handleChange("endYear", v)}
                disabled={disabled || address.isCurrent}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </>
        )}
      </div>

      {(errors.dateRange || errors.overlap) && (
        <div className="text-sm text-red-500" role="alert">
          {errors.dateRange || errors.overlap}
        </div>
      )}
    </div>
  );
}
