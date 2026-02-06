import { z } from "zod";

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
}).refine(
  (data) => {
    if (!data.isCurrent && data.startMonth && data.startYear && data.endMonth && data.endYear) {
      const start = new Date(parseInt(data.startYear), parseInt(data.startMonth) - 1);
      const end = new Date(parseInt(data.endYear), parseInt(data.endMonth) - 1);
      return start <= end;
    }
    return true;
  },
  { message: "Start date must be before end date", path: ["startMonth"] }
).refine(
  (data) => {
    if (data.country === "United States" || data.country === "US" || data.country === "USA") {
      return /^\d{5}(-\d{4})?$/.test(data.zip);
    }
    return true;
  },
  { message: "ZIP code must be 5 digits (or 5+4 format)", path: ["zip"] }
);

export type AddressFormData = z.infer<typeof addressSchema>;

export const currentAddressSchema = addressSchema;

export const previousAddressSchema = addressSchema.refine(
  (data) => data.endMonth && data.endMonth.length > 0,
  { message: "End month is required for previous addresses", path: ["endMonth"] }
).refine(
  (data) => data.endYear && data.endYear.length > 0,
  { message: "End year is required for previous addresses", path: ["endYear"] }
);
