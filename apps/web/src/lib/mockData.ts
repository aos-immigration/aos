import type { Id } from "../../convex/_generated/dataModel";

// ── Mock Petitioner Basics ──

export const MOCK_PETITIONER_BASICS = {
  givenName: "Maria Elena",
  middleName: "Sofia",
  familyName: "Rodriguez",
  dateOfBirth: { month: "03", day: "15", year: "1990" },
  placeOfBirth: "San Juan, Puerto Rico",
  citizenshipStatus: "us_citizen",
  relationship: "spouse",
  email: "maria.rodriguez@example.com",
  phone: "217-555-0142",
} as const;

// ── Mock Petitioner Addresses ──

export const MOCK_PETITIONER_ADDRESSES = [
  {
    personRole: "petitioner",
    street: "742 Evergreen Terrace",
    unit: "Apt 3B",
    city: "Springfield",
    state: "IL",
    zip: "62704",
    country: "United States",
    startMonth: "01",
    startYear: "2022",
    isCurrent: true,
    addressType: "physical",
    sortOrder: 0,
  },
  {
    personRole: "petitioner",
    street: "1234 Oak Street",
    city: "Chicago",
    state: "IL",
    zip: "60601",
    country: "United States",
    startMonth: "06",
    startYear: "2019",
    endMonth: "12",
    endYear: "2021",
    isCurrent: false,
    addressType: "physical",
    sortOrder: 1,
  },
] as const;

// ── Mock Petitioner Employment ──

export const MOCK_PETITIONER_EMPLOYMENT = [
  {
    personRole: "petitioner",
    status: "employed",
    employerName: "Tech Solutions Inc",
    jobTitle: "Software Engineer",
    employerAddress: "100 Innovation Drive",
    city: "Springfield",
    state: "IL",
    country: "United States",
    fromMonth: "03",
    fromYear: "2022",
    isCurrent: true,
    sortOrder: 0,
  },
  {
    personRole: "petitioner",
    status: "employed",
    employerName: "StartupCo",
    jobTitle: "Junior Developer",
    employerAddress: "456 Wacker Drive",
    city: "Chicago",
    state: "IL",
    country: "United States",
    fromMonth: "01",
    fromYear: "2020",
    toMonth: "02",
    toYear: "2022",
    isCurrent: false,
    sortOrder: 1,
  },
] as const;

// ── Mock Beneficiary Addresses ──

export const MOCK_BENEFICIARY_ADDRESSES = [
  {
    personRole: "beneficiary",
    street: "742 Evergreen Terrace",
    unit: "Apt 3B",
    city: "Springfield",
    state: "IL",
    zip: "62704",
    country: "United States",
    startMonth: "01",
    startYear: "2022",
    isCurrent: true,
    addressType: "physical",
    sortOrder: 0,
  },
  {
    personRole: "beneficiary",
    street: "89 Calle del Sol",
    city: "Mexico City",
    state: "",
    zip: "06600",
    country: "Mexico",
    startMonth: "03",
    startYear: "2018",
    endMonth: "12",
    endYear: "2021",
    isCurrent: false,
    addressType: "physical",
    sortOrder: 1,
  },
] as const;

// ── Mock Beneficiary Employment ──

export const MOCK_BENEFICIARY_EMPLOYMENT = [
  {
    personRole: "beneficiary",
    status: "employed",
    employerName: "Global Consulting Group",
    jobTitle: "Business Analyst",
    employerAddress: "200 Commerce Blvd",
    city: "Springfield",
    state: "IL",
    country: "United States",
    fromMonth: "02",
    fromYear: "2022",
    isCurrent: true,
    sortOrder: 0,
  },
  {
    personRole: "beneficiary",
    status: "employed",
    employerName: "Empresa Nacional SA",
    jobTitle: "Administrative Assistant",
    employerAddress: "45 Av Reforma",
    city: "Mexico City",
    state: "",
    country: "Mexico",
    fromMonth: "06",
    fromYear: "2019",
    toMonth: "01",
    toYear: "2022",
    isCurrent: false,
    sortOrder: 1,
  },
] as const;

// ── Fill All Mock Data ──

/* eslint-disable @typescript-eslint/no-explicit-any */
type FillAllMockDataMutations = {
  savePetitionerBasics: (args: any) => Promise<any>;
  saveAddress: (args: any) => Promise<any>;
  saveEmploymentEntry: (args: any) => Promise<any>;
};

export async function fillAllMockData(
  applicationId: Id<"applications">,
  mutations: FillAllMockDataMutations,
): Promise<void> {
  // Fill petitioner basics
  await mutations.savePetitionerBasics({
    applicationId,
    ...MOCK_PETITIONER_BASICS,
  });

  // Fill petitioner addresses
  for (const addr of MOCK_PETITIONER_ADDRESSES) {
    await mutations.saveAddress({ applicationId, ...addr });
  }

  // Fill petitioner employment
  for (const emp of MOCK_PETITIONER_EMPLOYMENT) {
    await mutations.saveEmploymentEntry({ applicationId, ...emp });
  }

  // Fill beneficiary addresses
  for (const addr of MOCK_BENEFICIARY_ADDRESSES) {
    await mutations.saveAddress({ applicationId, ...addr });
  }

  // Fill beneficiary employment
  for (const emp of MOCK_BENEFICIARY_EMPLOYMENT) {
    await mutations.saveEmploymentEntry({ applicationId, ...emp });
  }
}
