import { z } from "zod";

const employmentStatusOptions = ["employed", "unemployed", "student", "other"] as const;

const monthOptions = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const;

export const employmentBaseSchema = z.object({
  id: z.string(),
  status: z.enum(employmentStatusOptions, {
    message: "Employment status is required",
  }),
  employerName: z.string().default(""),
  jobTitle: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  country: z.string().optional().default(""),
  fromMonth: z.string().min(1, "Start month is required"),
  fromYear: z.string().min(1, "Start year is required"),
  toMonth: z.string().default(""),
  toYear: z.string().default(""),
  isCurrent: z.boolean(),
  notes: z.string().optional().default(""),
});

export const employmentSchema = employmentBaseSchema.refine(
  (data) => {
    if (data.status === "employed" && (!data.employerName || data.employerName.trim().length === 0)) {
      return false;
    }
    return true;
  },
  { message: "Employer name is required when employed", path: ["employerName"] }
).refine(
  (data) => {
    if (!data.isCurrent) {
      return data.toMonth && data.toMonth.length > 0;
    }
    return true;
  },
  { message: "End month is required for past employment", path: ["toMonth"] }
).refine(
  (data) => {
    if (!data.isCurrent) {
      return data.toYear && data.toYear.length > 0;
    }
    return true;
  },
  { message: "End year is required for past employment", path: ["toYear"] }
).refine(
  (data) => {
    if (!data.isCurrent && data.fromMonth && data.fromYear && data.toMonth && data.toYear) {
      const start = new Date(parseInt(data.fromYear), parseInt(data.fromMonth) - 1);
      const end = new Date(parseInt(data.toYear), parseInt(data.toMonth) - 1);
      return start <= end;
    }
    return true;
  },
  { message: "Start date must be before end date", path: ["fromMonth"] }
);

export type EmploymentFormData = z.infer<typeof employmentSchema>;

