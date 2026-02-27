import { z } from "zod";
import { getCountryCode, getPostalPattern, isPostalRequired } from "../countries";

export const addressSchema = z.object({
  id: z.string(),
  street: z.string().min(1, "Street address is required"),
  unit: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State / Province is required"),
  zip: z.string(),
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
  const countryCode = getCountryCode(data.country) || "";
  const postalRequired = isPostalRequired(countryCode);
  const postalPattern = getPostalPattern(countryCode);

  if (postalRequired && !data.zip) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: countryCode === "US" ? "ZIP code is required" : "Postal code is required",
      path: ["zip"],
    });
  } else if (data.zip && !postalPattern.test(data.zip)) {
    const messages: Record<string, string> = {
      US: "ZIP code must be 5 digits (or 5+4 format)",
      CA: "Postal code must be in format A1A 1A1",
      MX: "Postal code must be 5 digits",
    };
    if (messages[countryCode]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: messages[countryCode],
        path: ["zip"],
      });
    }
  }
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
