import { emptyIntake } from "./empty";
import type { Intake, IntakeAddress, IntakeEmployment } from "./schema";

const AS_OF = { month: "10" as const, year: "2021" };

function home(role: IntakeAddress["personRole"], id: string): IntakeAddress {
  return {
    id,
    personRole: role,
    kind: "physical",
    street: "100 Fictional Lane",
    unitType: "",
    unit: "",
    city: "Sample City",
    state: "CA",
    province: "",
    postal: "00000",
    country: "United States",
    startMonth: AS_OF.month,
    startYear: AS_OF.year,
    endMonth: "",
    endYear: "",
    isCurrent: true,
    gapExplanation: "",
  };
}

function job(
  role: IntakeEmployment["personRole"],
  id: string,
  status: IntakeEmployment["status"],
  employerName: string,
  jobTitle: string,
): IntakeEmployment {
  return {
    id,
    personRole: role,
    status,
    employerName,
    jobTitle,
    city: "Sample City",
    state: "CA",
    country: "United States",
    fromMonth: AS_OF.month,
    fromYear: AS_OF.year,
    toMonth: "",
    toYear: "",
    isCurrent: true,
    gapExplanation: "",
  };
}

export function demoIntake(): Intake {
  const intake = emptyIntake();
  intake.source = "demo";
  intake.selectedForms = [
    "i-130",
    "i-130a",
    "i-485",
    "i-864",
    "i-765",
    "i-131",
    "g-1145",
  ];
  intake.disclaimerAckAt = "2026-10-03T00:00:00.000Z";
  intake.petitioner = {
    givenName: "Jordan",
    middleName: "Q",
    familyName: "Sampleton",
    otherNames: "",
    sex: "female",
    dateOfBirth: { month: "03", day: "14", year: "1990" },
    birthCity: "Sample City",
    birthCountry: "United States",
    citizenship: "us_citizen",
    aNumber: "A000000000",
    ssn: "000-00-0000",
    email: "jordan.sampleton@example.com",
    phone: "000-000-0000",
  };
  intake.beneficiary = {
    givenName: "Avery",
    middleName: "R",
    familyName: "Exampleton",
    otherNames: "",
    sex: "male",
    dateOfBirth: { month: "07", day: "02", year: "1992" },
    birthCity: "Faketown",
    birthCountry: "Fictionland",
    citizenship: "other",
    aNumber: "A000000001",
    ssn: "000-00-0000",
    email: "avery.exampleton@example.com",
    phone: "000-000-0001",
  };
  intake.marriage = {
    date: { month: "06", day: "15", year: "2024" },
    city: "Sample City",
    country: "United States",
    liveTogether: "yes",
  };
  intake.addresses = [home("petitioner", "demo-pet-addr"), home("beneficiary", "demo-ben-addr")];
  intake.employment = [
    job("petitioner", "demo-pet-job", "employed", "Sampleton Demo Co", "Clerk"),
    job("beneficiary", "demo-ben-job", "student", "Fictional University", "Student"),
  ];
  intake.immigration = {
    classOfAdmission: "F1",
    i94Number: "00000000000",
    arrival: { month: "08", day: "01", year: "2022" },
    portOfEntry: "Sample City",
    passportNumber: "P0000000",
    passportCountry: "Fictionland",
    passportExpiry: { month: "01", day: "01", year: "2030" },
    currentStatus: "F1",
  };
  intake.eligibility = intake.eligibility.map((item) => ({
    ...item,
    answer: "no",
  }));
  intake.sponsor = {
    householdSize: "2",
    currentIncome: "100000",
    taxYear: "2025",
    taxIncome: "100000",
  };
  intake.biographics.beneficiary = {
    ethnicity: "not_hispanic",
    race: ["asian"],
    heightFeet: "5",
    heightInches: "6",
    weightPounds: "150",
    eye: "brown",
    hair: "black",
  };
  return intake;
}
