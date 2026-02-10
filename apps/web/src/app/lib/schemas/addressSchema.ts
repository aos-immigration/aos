import { z } from "zod";
import { isDateInFuture } from "../dateUtils";

const monthOptions = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const;

export const addressSchema = z.object({
  id: z.string(),
  street: z.string().min(1, "Street address is required"),
  unit: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  startMonth: z.string().min(1, "Start month is required"),
  startYear: z.string().min(1, "Start year is required"),
  startDay: z.string().optional(),
  endMonth: z.string().optional(),
  endYear: z.string().optional(),
  endDay: z.string().optional(),
  isCurrent: z.boolean(),
  gapExplanation: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  // ZIP code validation
  const country = data.country.trim().toLowerCase();
  const isUS = country === "united states" || country === "usa" || country === "us";

  if (isUS) {
    if (!/^\d{5}(-\d{4})?$/.test(data.zip)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ZIP code must be 5 digits (or 5+4 format)",
        path: ["zip"],
      });
    }
  }

  // Future date validation
  if (data.startMonth && data.startYear) {
    if (isDateInFuture(data.startMonth, data.startYear)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date cannot be in the future",
        path: ["startMonth"],
      });
      // Also highlight year if preferred, but usually month is enough
    }
  }

  // Date range validation
  if (!data.isCurrent && data.startMonth && data.startYear && data.endMonth && data.endYear) {
    const start = new Date(parseInt(data.startYear), parseInt(data.startMonth) - 1);
    const end = new Date(parseInt(data.endYear), parseInt(data.endMonth) - 1);
    if (start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date must be before end date",
        path: ["startMonth"],
      });
    }
  }
});

export type AddressFormData = z.infer<typeof addressSchema>;

export const currentAddressSchema = addressSchema;

export const previousAddressSchema = addressSchema.refine(
  (data) => data.endMonth && data.endMonth.length > 0,
  { message: "End month is required for previous addresses", path: ["endMonth"] }
).refine(
  (data) => data.endYear && data.endYear.length > 0,
  { message: "End year is required for previous addresses", path: ["endYear"] }
);
