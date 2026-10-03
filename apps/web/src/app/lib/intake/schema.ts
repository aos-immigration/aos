import { z } from "zod";

export const FORM_IDS = [
  "i-130",
  "i-130a",
  "i-485",
  "i-864",
  "i-765",
  "i-131",
  "g-1145",
] as const;

export const formIdSchema = z.enum(FORM_IDS);
export type FormId = z.infer<typeof formIdSchema>;

export const triStateSchema = z.enum(["unanswered", "yes", "no"]);
export type TriState = z.infer<typeof triStateSchema>;

export const monthSchema = z.enum([
  "",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
]);

export const personRoleSchema = z.enum(["petitioner", "beneficiary"]);
export type PersonRole = z.infer<typeof personRoleSchema>;

const datePartsSchema = z.object({
  month: monthSchema,
  day: z.string(),
  year: z.string(),
});

export const personSchema = z.object({
  givenName: z.string(),
  middleName: z.string(),
  familyName: z.string(),
  otherNames: z.string(),
  sex: z.enum(["", "female", "male"]),
  dateOfBirth: datePartsSchema,
  birthCity: z.string(),
  birthCountry: z.string(),
  citizenship: z.enum(["", "us_citizen", "lpr", "other"]),
  aNumber: z.string(),
  ssn: z.string(),
  email: z.string(),
  phone: z.string(),
});

export const addressSchema = z.object({
  id: z.string(),
  personRole: personRoleSchema,
  kind: z.enum(["physical", "mailing"]),
  street: z.string(),
  unitType: z.enum(["", "apt", "ste", "flr"]),
  unit: z.string(),
  city: z.string(),
  state: z.string(),
  province: z.string(),
  postal: z.string(),
  country: z.string(),
  startMonth: monthSchema,
  startYear: z.string(),
  endMonth: monthSchema,
  endYear: z.string(),
  isCurrent: z.boolean(),
  gapExplanation: z.string(),
});

export const employmentSchema = z.object({
  id: z.string(),
  personRole: personRoleSchema,
  status: z.enum(["", "employed", "unemployed", "student", "other"]),
  employerName: z.string(),
  jobTitle: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  fromMonth: monthSchema,
  fromYear: z.string(),
  toMonth: monthSchema,
  toYear: z.string(),
  isCurrent: z.boolean(),
  gapExplanation: z.string(),
});

export const priorMarriageSchema = z.object({
  id: z.string(),
  personRole: personRoleSchema,
  spouseGiven: z.string(),
  spouseFamily: z.string(),
  startMonth: monthSchema,
  startYear: z.string(),
  endMonth: monthSchema,
  endYear: z.string(),
  howEnded: z.enum(["", "divorce", "annulment", "death", "other"]),
});

export const parentSchema = z.object({
  personRole: personRoleSchema,
  which: z.enum(["mother", "father"]),
  givenName: z.string(),
  familyName: z.string(),
  birthCountry: z.string(),
  deceased: triStateSchema,
});

export const bioSchema = z.object({
  ethnicity: z.enum(["", "hispanic", "not_hispanic"]),
  race: z.array(z.enum(["white", "asian", "black", "native", "pacific"])),
  heightFeet: z.string(),
  heightInches: z.string(),
  weightPounds: z.string(),
  eye: z.string(),
  hair: z.string(),
});

export const ELIGIBILITY_IDS = [
  "removal",
  "arrest",
  "unlawful_presence",
  "unauthorized_work",
  "fraud",
  "false_citizenship",
  "prior_denial",
] as const;

export const eligibilityItemSchema = z.object({
  id: z.enum(ELIGIBILITY_IDS),
  answer: triStateSchema,
  explanation: z.string(),
});

export const intakeSchema = z.object({
  version: z.literal(1),
  source: z.enum(["user", "demo"]),
  selectedForms: z.array(formIdSchema),
  filingMethod: z.enum(["paper", "online"]),
  disclaimerAckAt: z.string().nullable(),
  petitioner: personSchema,
  beneficiary: personSchema,
  marriage: z.object({
    date: datePartsSchema,
    city: z.string(),
    country: z.string(),
    liveTogether: triStateSchema,
  }),
  priorMarriages: z.array(priorMarriageSchema),
  parents: z.array(parentSchema),
  addresses: z.array(addressSchema),
  employment: z.array(employmentSchema),
  biographics: z.object({
    petitioner: bioSchema,
    beneficiary: bioSchema,
  }),
  immigration: z.object({
    classOfAdmission: z.string(),
    i94Number: z.string(),
    arrival: datePartsSchema,
    portOfEntry: z.string(),
    passportNumber: z.string(),
    passportCountry: z.string(),
    passportExpiry: datePartsSchema,
    currentStatus: z.string(),
  }),
  eligibility: z.array(eligibilityItemSchema),
  sponsor: z.object({
    householdSize: z.string(),
    currentIncome: z.string(),
    taxYear: z.string(),
    taxIncome: z.string(),
  }),
  documents: z.array(
    z.object({
      slot: z.string(),
      status: z.enum(["needed", "uploaded", "accepted", "needs_copy"]),
      fileName: z.string(),
      uploadedAt: z.string(),
      note: z.string(),
    }),
  ),
});

export type Intake = z.infer<typeof intakeSchema>;
export type IntakeAddress = z.infer<typeof addressSchema>;
export type IntakeEmployment = z.infer<typeof employmentSchema>;

export function parseIntake(payload: string): Intake {
  let json: unknown;
  try {
    json = JSON.parse(payload);
  } catch {
    throw new Error("Intake payload is not valid JSON.");
  }
  const parsed = intakeSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".") || "intake";
    throw new Error(`Intake field ${path} is invalid.`);
  }
  return parsed.data;
}
