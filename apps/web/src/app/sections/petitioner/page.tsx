"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../../../../convex/_generated/api";
import {
  petitionerBasicsSchema,
  type PetitionerBasicsFormData,
} from "../../lib/schemas/petitionerBasicsSchema";
import type { Resolver } from "react-hook-form";
import { useApplicationId } from "../../lib/useApplicationId";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

const YEARS = Array.from({ length: 100 }, (_, i) => String(2026 - i));

const CITIZENSHIP_OPTIONS = [
  { value: "us_citizen", label: "U.S. Citizen" },
  { value: "lpr", label: "Lawful Permanent Resident" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Brother/Sister" },
];

export default function PetitionerPage() {
  const applicationId = useApplicationId();
  const existingData = useQuery(
    api.petitioner.getPetitionerBasics,
    applicationId ? { applicationId } : "skip"
  );
  const saveMutation = useMutation(api.petitioner.savePetitionerBasics);

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);

  const {
    register,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<PetitionerBasicsFormData>({
    resolver: zodResolver(petitionerBasicsSchema) as Resolver<PetitionerBasicsFormData>,
    defaultValues: {
      givenName: "",
      middleName: "",
      familyName: "",
      dateOfBirth: { month: "" as "01", day: "", year: "" },
      placeOfBirth: "",
      citizenshipStatus: undefined,
      relationship: undefined,
      email: "",
      phone: "",
    },
  });

  // Load existing data into form
  useEffect(() => {
    if (existingData && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      reset({
        givenName: existingData.givenName,
        middleName: existingData.middleName ?? "",
        familyName: existingData.familyName,
        dateOfBirth: existingData.dateOfBirth as PetitionerBasicsFormData["dateOfBirth"],
        placeOfBirth: existingData.placeOfBirth ?? "",
        citizenshipStatus: existingData.citizenshipStatus as PetitionerBasicsFormData["citizenshipStatus"],
        relationship: existingData.relationship as PetitionerBasicsFormData["relationship"],
        email: existingData.email ?? "",
        phone: existingData.phone ?? "",
      });
    }
  }, [existingData, reset]);

  // Debounced auto-save
  const debouncedSave = useCallback(
    (data: PetitionerBasicsFormData) => {
      if (!applicationId) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          setSaveStatus("saving");
          await saveMutation({
            applicationId,
            givenName: data.givenName,
            middleName: data.middleName || undefined,
            familyName: data.familyName,
            dateOfBirth: data.dateOfBirth,
            placeOfBirth: data.placeOfBirth || undefined,
            citizenshipStatus: data.citizenshipStatus,
            relationship: data.relationship,
            email: data.email || undefined,
            phone: data.phone || undefined,
          });
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setSaveStatus("idle");
        }
      }, 500);
    },
    [applicationId, saveMutation]
  );

  // Watch all fields and auto-save on change
  useEffect(() => {
    const subscription = watch((data) => {
      if (!hasLoadedRef.current && !existingData) {
        // Don't save until we've either loaded data or confirmed there's none
        return;
      }
      // Only save if required fields are present
      if (data.givenName && data.familyName && data.citizenshipStatus && data.relationship) {
        debouncedSave(data as PetitionerBasicsFormData);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedSave, existingData]);

  if (!applicationId) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Petitioner Information
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Tell us about yourself. This information will be used across all
            required forms automatically.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {saveStatus === "saving" && (
            <span className="text-amber-500">Saving...</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-green-500">Saved ✓</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Legal Identity */}
          <div className="border border-border p-6 rounded-xl space-y-6 bg-card">
            <div className="flex items-center gap-3">
              <span className="text-primary text-xl">👤</span>
              <h3 className="font-medium">Legal Identity</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Legal First Name
                </Label>
                <Input
                  {...register("givenName")}
                  placeholder="John"
                />
                {errors.givenName && (
                  <p className="text-xs text-red-500">{errors.givenName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Legal Last Name
                </Label>
                <Input
                  {...register("familyName")}
                  placeholder="Doe"
                />
                {errors.familyName && (
                  <p className="text-xs text-red-500">{errors.familyName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Middle Name (If any)
                </Label>
                <Input
                  {...register("middleName")}
                  placeholder="Quincy"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Place of Birth
                </Label>
                <Input
                  {...register("placeOfBirth")}
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* Date of Birth - 3 selects */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Date of Birth
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <Controller
                  control={control}
                  name="dateOfBirth.month"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Controller
                  control={control}
                  name="dateOfBirth.day"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Controller
                  control={control}
                  name="dateOfBirth.year"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {errors.dateOfBirth && (
                <p className="text-xs text-red-500">
                  {errors.dateOfBirth.month?.message ||
                    errors.dateOfBirth.day?.message ||
                    errors.dateOfBirth.year?.message}
                </p>
              )}
            </div>

            {/* Citizenship & Relationship */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Citizenship Status
                </Label>
                <Controller
                  control={control}
                  name="citizenshipStatus"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIZENSHIP_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.citizenshipStatus && (
                  <p className="text-xs text-red-500">{errors.citizenshipStatus.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Relationship to Beneficiary
                </Label>
                <Controller
                  control={control}
                  name="relationship"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.relationship && (
                  <p className="text-xs text-red-500">{errors.relationship.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border border-border p-6 rounded-xl space-y-6 bg-card">
            <div className="flex items-center gap-3">
              <span className="text-primary text-xl">📧</span>
              <h3 className="font-medium">Contact Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Email Address
                </Label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Phone Number
                </Label>
                <Input
                  {...register("phone")}
                  type="tel"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
