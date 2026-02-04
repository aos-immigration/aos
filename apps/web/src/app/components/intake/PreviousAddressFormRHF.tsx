"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { previousAddressSchema, type AddressFormData } from "@/app/lib/schemas/addressSchema";
import { getMonthOptions, getYearOptions } from "@/app/lib/dateUtils";
import { US_STATES } from "@/app/lib/constants";
import type { AddressEntry, MonthValue } from "@/app/lib/intakeStorage";

type PreviousAddressFormRHFProps = {
  readonly address: AddressEntry;
  readonly onSave: (address: AddressEntry) => void;
  readonly onCancel: () => void;
  readonly index: number;
};

export function PreviousAddressFormRHF({
  address,
  onSave,
  onCancel,
  index,
}: PreviousAddressFormRHFProps) {
  const months = getMonthOptions();
  const years = getYearOptions();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(previousAddressSchema),
    defaultValues: {
      id: address.id,
      street: address.street || "",
      unit: address.unit || "",
      city: address.city || "",
      state: address.state || "",
      zip: address.zip || "",
      country: address.country || "United States",
      startMonth: address.startMonth || "",
      startYear: address.startYear || "",
      endMonth: address.endMonth || "",
      endYear: address.endYear || "",
      isCurrent: false,
    },
  });

  const onSubmit = (data: AddressFormData) => {
    onSave({
      ...data,
      startMonth: data.startMonth as MonthValue,
      endMonth: data.endMonth as MonthValue,
    } as AddressEntry);
  };

  const stateValue = watch("state");
  const startMonthValue = watch("startMonth");
  const startYearValue = watch("startYear");
  const endMonthValue = watch("endMonth");
  const endYearValue = watch("endYear");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Previous Address {index}
      </h3>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 text-sm sm:col-span-2">
            <Label htmlFor="street">Street address</Label>
            <Input
              id="street"
              {...register("street")}
              placeholder="123 Main St"
              aria-invalid={!!errors.street}
            />
            {errors.street && (
              <span className="text-xs text-red-500">{errors.street.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <Label htmlFor="unit">Unit / Apt</Label>
            <Input
              id="unit"
              {...register("unit")}
              placeholder="Apt 2B"
            />
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              {...register("city")}
              placeholder="San Jose"
              aria-invalid={!!errors.city}
            />
            {errors.city && (
              <span className="text-xs text-red-500">{errors.city.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <Label>State</Label>
            <Select
              value={stateValue || undefined}
              onValueChange={(v) => setValue("state", v, { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.state}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((st) => (
                  <SelectItem key={st} value={st}>{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && (
              <span className="text-xs text-red-500">{errors.state.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              {...register("zip")}
              placeholder="95112"
              aria-invalid={!!errors.zip}
            />
            {errors.zip && (
              <span className="text-xs text-red-500">{errors.zip.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register("country")}
              placeholder="United States"
              aria-invalid={!!errors.country}
            />
            {errors.country && (
              <span className="text-xs text-red-500">{errors.country.message}</span>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-2 text-sm">
            <Label>Start month</Label>
            <Select
              value={startMonthValue || undefined}
              onValueChange={(v) => setValue("startMonth", v, { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.startMonth}>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.startMonth && (
              <span className="text-xs text-red-500">{errors.startMonth.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <Label>Start year</Label>
            <Select
              value={startYearValue || undefined}
              onValueChange={(v) => setValue("startYear", v, { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.startYear}>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.startYear && (
              <span className="text-xs text-red-500">{errors.startYear.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <Label>End month</Label>
            <Select
              value={endMonthValue || undefined}
              onValueChange={(v) => setValue("endMonth", v, { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.endMonth}>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.endMonth && (
              <span className="text-xs text-red-500">{errors.endMonth.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <Label>End year</Label>
            <Select
              value={endYearValue || undefined}
              onValueChange={(v) => setValue("endYear", v, { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.endYear}>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.endYear && (
              <span className="text-xs text-red-500">{errors.endYear.message}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Address
        </Button>
      </div>
    </form>
  );
}
