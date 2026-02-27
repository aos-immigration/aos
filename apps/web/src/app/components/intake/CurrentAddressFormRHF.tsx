"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currentAddressSchema, type AddressFormData } from "@/app/lib/schemas/addressSchema";
import { getMonthOptions, getYearOptions } from "@/app/lib/dateUtils";
import type { AddressEntry, MonthValue } from "@/app/lib/intakeStorage";
import { AddressFormFields } from "./AddressFormFields";

type CurrentAddressFormRHFProps = {
  readonly address: AddressEntry;
  readonly onSave: (address: AddressEntry) => void;
};

export function CurrentAddressFormRHF({
  address,
  onSave,
}: CurrentAddressFormRHFProps) {
  const months = getMonthOptions();
  const years = getYearOptions();

  const methods = useForm<AddressFormData>({
    resolver: zodResolver(currentAddressSchema),
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
      isCurrent: true,
    },
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  const onSubmit = (data: AddressFormData) => {
    onSave({
      ...data,
      startMonth: data.startMonth as MonthValue,
      isCurrent: true,
      endMonth: undefined,
      endYear: undefined,
      endDay: undefined,
    } as AddressEntry);
  };

  const startMonthValue = watch("startMonth");
  const startYearValue = watch("startYear");

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Current Address
          </h3>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            Present
          </span>
        </div>

        <div className="grid gap-4">
          <AddressFormFields />

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            Save Address
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
