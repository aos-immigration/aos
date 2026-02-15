"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mailingAddressSchema, type MailingAddressFormData } from "@/app/lib/schemas/addressSchema";
import { US_STATES } from "@/app/lib/constants";
import type { AddressEntry } from "@/app/lib/intakeStorage";
import { useEffect } from "react";

type MailingAddressFormRHFProps = {
  readonly address: AddressEntry;
  readonly onSave: (patch: Partial<AddressEntry>) => void;
};

export function MailingAddressFormRHF({
  address,
  onSave,
}: MailingAddressFormRHFProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MailingAddressFormData>({
    resolver: zodResolver(mailingAddressSchema),
    defaultValues: {
      id: address.id,
      street: address.street || "",
      unit: address.unit || "",
      city: address.city || "",
      state: address.state || "",
      zip: address.zip || "",
      country: address.country || "United States",
    },
  });

  const watchedData = watch();

  useEffect(() => {
    onSave({
      street: watchedData.street,
      unit: watchedData.unit,
      city: watchedData.city,
      state: watchedData.state,
      zip: watchedData.zip,
      country: watchedData.country,
    });
  }, [
    watchedData.street,
    watchedData.unit,
    watchedData.city,
    watchedData.state,
    watchedData.zip,
    watchedData.country,
    onSave,
  ]);

  const stateValue = watch("state");

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 text-sm sm:col-span-2">
          <Label htmlFor="mailing-street">Street address</Label>
          <Input
            id="mailing-street"
            {...register("street")}
            placeholder="123 Main St"
            aria-invalid={!!errors.street}
          />
          {errors.street && (
            <span className="text-xs text-red-500">{errors.street.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <Label htmlFor="mailing-unit">Unit / Apt</Label>
          <Input
            id="mailing-unit"
            {...register("unit")}
            placeholder="Apt 2B"
          />
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <Label htmlFor="mailing-city">City</Label>
          <Input
            id="mailing-city"
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
          <Label htmlFor="mailing-zip">ZIP Code</Label>
          <Input
            id="mailing-zip"
            {...register("zip")}
            placeholder="95112"
            aria-invalid={!!errors.zip}
          />
          {errors.zip && (
            <span className="text-xs text-red-500">{errors.zip.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <Label htmlFor="mailing-country">Country</Label>
          <Input
            id="mailing-country"
            {...register("country")}
            placeholder="United States"
            aria-invalid={!!errors.country}
          />
          {errors.country && (
            <span className="text-xs text-red-500">{errors.country.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
