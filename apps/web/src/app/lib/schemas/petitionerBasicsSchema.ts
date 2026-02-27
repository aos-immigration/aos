import { z } from "zod";

const monthOptions = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const;

const relationshipOptions = ["spouse", "parent", "child", "sibling"] as const;

const citizenshipStatusOptions = ["us_citizen", "lpr"] as const;

export const dateOfBirthSchema = z.object({
  month: z.enum(monthOptions, { message: "Month is required" }),
  day: z.string().min(1, "Day is required"),
  year: z.string().min(1, "Year is required"),
});

export const petitionerBasicsSchema = z.object({
  givenName: z.string().min(1, "Given (first) name is required"),
  middleName: z.string().optional().default(""),
  familyName: z.string().min(1, "Family (last) name is required"),
  dateOfBirth: dateOfBirthSchema,
  placeOfBirth: z.string().optional().default(""),
  citizenshipStatus: z.enum(citizenshipStatusOptions, {
    message: "Citizenship status is required",
  }),
  relationship: z.enum(relationshipOptions, {
    message: "Relationship is required",
  }),
  email: z
    .string()
    .optional()
    .default("")
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Please enter a valid email address"
    ),
  phone: z.string().optional().default(""),
});

export type PetitionerBasicsFormData = z.infer<typeof petitionerBasicsSchema>;

