import { ELIGIBILITY_IDS, type PersonRole } from "./schema";

export type FieldSpec = {
  path: string;
  label: string;
  sensitive?: boolean;
  input?: "text" | "email" | "tel";
};

export type ChoiceOption = {
  value: string;
  title: string;
  definition: string;
};

type StepBase = {
  id: string;
  title: string;
  why?: string;
};

export type Step = StepBase &
  (
    | { kind: "fields"; fields: FieldSpec[] }
    | { kind: "choice"; path: string; options: ChoiceOption[]; advance: boolean }
    | { kind: "date"; path: string }
    | { kind: "multi"; path: string; options: ChoiceOption[] }
    | { kind: "priors" }
  );

const SEX: ChoiceOption[] = [
  { value: "female", title: "Female", definition: "As listed on the birth record or passport." },
  { value: "male", title: "Male", definition: "As listed on the birth record or passport." },
];

const CITIZENSHIP: ChoiceOption[] = [
  { value: "us_citizen", title: "U.S. citizen", definition: "Born in the U.S. or naturalized." },
  { value: "lpr", title: "Lawful permanent resident", definition: "Has a green card." },
  { value: "other", title: "Another status", definition: "Any status that is not a citizen or resident." },
];

const YES_NO: ChoiceOption[] = [
  { value: "yes", title: "Yes", definition: "This applies." },
  { value: "no", title: "No", definition: "This does not apply." },
];

const ELIGIBILITY_TITLES: Record<(typeof ELIGIBILITY_IDS)[number], string> = {
  removal: "Has the beneficiary been in removal proceedings?",
  arrest: "Has the beneficiary been arrested, cited, charged, or detained?",
  unlawful_presence: "Has the beneficiary been in the U.S. without admission, or stayed past an authorized stay?",
  unauthorized_work: "Has the beneficiary worked in the U.S. without authorization?",
  fraud: "Has the beneficiary lied to, or hidden facts from, a U.S. immigration official?",
  false_citizenship: "Has the beneficiary claimed to be a U.S. citizen?",
  prior_denial: "Has a U.S. immigration application or petition for the beneficiary been denied?",
};

function personSteps(role: PersonRole, parentIndex: number): Step[] {
  const title = role === "petitioner" ? "petitioner" : "beneficiary";
  const who =
    role === "petitioner"
      ? "The petitioner is the spouse who files the I-130."
      : "The beneficiary is the spouse the petition is for.";
  const steps: Step[] = [
    {
      id: `${role}-name`,
      kind: "fields",
      title: `What is the ${title}'s legal name?`,
      why: who,
      fields: [
        { path: `${role}.givenName`, label: "Given name" },
        { path: `${role}.middleName`, label: "Middle name" },
        { path: `${role}.familyName`, label: "Family name" },
      ],
    },
    {
      id: `${role}-other`,
      kind: "fields",
      title: `Has the ${title} used any other names?`,
      why: "USCIS matches names that appear on older records.",
      fields: [{ path: `${role}.otherNames`, label: "Other names" }],
    },
    {
      id: `${role}-sex`,
      kind: "choice",
      title: `What is the ${title}'s sex?`,
      path: `${role}.sex`,
      options: SEX,
      advance: true,
    },
    {
      id: `${role}-dob`,
      kind: "date",
      title: `When was the ${title} born?`,
      path: `${role}.dateOfBirth`,
    },
    {
      id: `${role}-birthplace`,
      kind: "fields",
      title: `Where was the ${title} born?`,
      fields: [
        { path: `${role}.birthCity`, label: "City or town" },
        { path: `${role}.birthCountry`, label: "Country" },
      ],
    },
    {
      id: `${role}-citizenship`,
      kind: "choice",
      title: `What is the ${title}'s citizenship or status?`,
      path: `${role}.citizenship`,
      options: CITIZENSHIP,
      advance: true,
    },
    {
      id: `${role}-anumber`,
      kind: "fields",
      title: `What is the ${title}'s A-Number, if any?`,
      why: "Leave this blank if USCIS has not issued one.",
      fields: [{ path: `${role}.aNumber`, label: "A-Number", sensitive: true }],
    },
    {
      id: `${role}-ssn`,
      kind: "fields",
      title: `What is the ${title}'s Social Security number, if any?`,
      why: "Leave this blank if there is no Social Security number.",
      fields: [{ path: `${role}.ssn`, label: "Social Security number", sensitive: true }],
    },
    {
      id: `${role}-contact`,
      kind: "fields",
      title: `How can USCIS reach the ${title}?`,
      fields: [
        { path: `${role}.email`, label: "Email", input: "email" },
        { path: `${role}.phone`, label: "Phone", input: "tel" },
      ],
    },
  ];

  (["mother", "father"] as const).forEach((which, offset) => {
    const index = parentIndex + offset;
    steps.push(
      {
        id: `${role}-${which}`,
        kind: "fields",
        title: `What is the ${title}'s ${which}'s name?`,
        fields: [
          { path: `parents.${index}.givenName`, label: "Given name" },
          { path: `parents.${index}.familyName`, label: "Family name" },
          { path: `parents.${index}.birthCountry`, label: "Country of birth" },
        ],
      },
      {
        id: `${role}-${which}-deceased`,
        kind: "choice",
        title: `Is the ${title}'s ${which} deceased?`,
        path: `parents.${index}.deceased`,
        options: YES_NO,
        advance: true,
      },
    );
  });

  return steps;
}

export const petitionerSteps = personSteps("petitioner", 0);
export const beneficiarySteps = personSteps("beneficiary", 2);

export const maritalSteps: Step[] = [
  {
    id: "marriage-date",
    kind: "date",
    title: "When did you marry?",
    path: "marriage.date",
  },
  {
    id: "marriage-place",
    kind: "fields",
    title: "Where did you marry?",
    fields: [
      { path: "marriage.city", label: "City or town" },
      { path: "marriage.country", label: "Country" },
    ],
  },
  {
    id: "live-together",
    kind: "choice",
    title: "Do you live at the same address?",
    path: "marriage.liveTogether",
    options: [
      { value: "yes", title: "Yes", definition: "You share one physical address." },
      { value: "no", title: "No", definition: "You live at different addresses." },
    ],
    advance: true,
  },
  {
    id: "priors",
    kind: "priors",
    title: "List any earlier marriages",
    why: "Each earlier marriage needs an end date before the current marriage.",
  },
];

export const biographicSteps: Step[] = [
  {
    id: "ethnicity",
    kind: "choice",
    title: "What is the beneficiary's ethnicity?",
    path: "biographics.beneficiary.ethnicity",
    options: [
      { value: "hispanic", title: "Hispanic or Latino", definition: "The category on the biographic form." },
      { value: "not_hispanic", title: "Not Hispanic or Latino", definition: "The category on the biographic form." },
    ],
    advance: true,
  },
  {
    id: "race",
    kind: "multi",
    title: "What is the beneficiary's race?",
    why: "Select every category that applies. This matches the biographic form.",
    path: "biographics.beneficiary.race",
    options: [
      { value: "white", title: "White", definition: "" },
      { value: "asian", title: "Asian", definition: "" },
      { value: "black", title: "Black or African American", definition: "" },
      { value: "native", title: "American Indian or Alaska Native", definition: "" },
      { value: "pacific", title: "Native Hawaiian or other Pacific Islander", definition: "" },
    ],
  },
  {
    id: "body",
    kind: "fields",
    title: "What is the beneficiary's height and weight?",
    fields: [
      { path: "biographics.beneficiary.heightFeet", label: "Height, feet" },
      { path: "biographics.beneficiary.heightInches", label: "Height, inches" },
      { path: "biographics.beneficiary.weightPounds", label: "Weight, pounds" },
    ],
  },
  {
    id: "features",
    kind: "fields",
    title: "What are the beneficiary's eye and hair colors?",
    fields: [
      { path: "biographics.beneficiary.eye", label: "Eye color" },
      { path: "biographics.beneficiary.hair", label: "Hair color" },
    ],
  },
];

export const immigrationSteps: Step[] = [
  {
    id: "status",
    kind: "fields",
    title: "What is the beneficiary's current immigration status?",
    fields: [
      { path: "immigration.classOfAdmission", label: "Class of admission" },
      { path: "immigration.currentStatus", label: "Current status" },
    ],
  },
  {
    id: "i94",
    kind: "fields",
    title: "What is the beneficiary's I-94 number and port of entry?",
    fields: [
      { path: "immigration.i94Number", label: "I-94 number", sensitive: true },
      { path: "immigration.portOfEntry", label: "Port of entry" },
    ],
  },
  {
    id: "arrival",
    kind: "date",
    title: "When did the beneficiary last arrive in the United States?",
    path: "immigration.arrival",
  },
  {
    id: "passport",
    kind: "fields",
    title: "What passport is the beneficiary using?",
    fields: [
      { path: "immigration.passportNumber", label: "Passport number", sensitive: true },
      { path: "immigration.passportCountry", label: "Country of issuance" },
    ],
  },
  {
    id: "passport-expiry",
    kind: "date",
    title: "When does that passport expire?",
    path: "immigration.passportExpiry",
  },
];

export const eligibilitySteps: Step[] = ELIGIBILITY_IDS.map((id, index) => ({
  id,
  kind: "choice" as const,
  title: ELIGIBILITY_TITLES[id],
  why: "A yes answer needs a short explanation. AOS does not decide whether you can file.",
  path: `eligibility.${index}.answer`,
  options: YES_NO,
  advance: false,
}));

export const sponsorSteps: Step[] = [
  {
    id: "household",
    kind: "fields",
    title: "What is the sponsor's household and income?",
    why: "The I-864 uses household size and current income. AOS does not say whether the income is enough.",
    fields: [
      { path: "sponsor.householdSize", label: "Household size" },
      { path: "sponsor.currentIncome", label: "Current annual income, dollars" },
    ],
  },
  {
    id: "tax",
    kind: "fields",
    title: "What did the sponsor report on the most recent tax return?",
    fields: [
      { path: "sponsor.taxYear", label: "Tax year" },
      { path: "sponsor.taxIncome", label: "Total income, dollars" },
    ],
  },
];

export function stepPaths(steps: readonly Step[]): string[] {
  const paths: string[] = [];
  for (const step of steps) {
    if (step.kind === "fields") paths.push(...step.fields.map((field) => field.path));
    if (step.kind === "choice" || step.kind === "date" || step.kind === "multi") paths.push(step.path);
  }
  return paths;
}
