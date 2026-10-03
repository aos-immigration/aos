import {
  ELIGIBILITY_IDS,
  type Intake,
  type PersonRole,
} from "./schema";

const blankDate = { month: "" as const, day: "", year: "" };

function blankPerson() {
  return {
    givenName: "",
    middleName: "",
    familyName: "",
    otherNames: "",
    sex: "" as const,
    dateOfBirth: { ...blankDate },
    birthCity: "",
    birthCountry: "",
    citizenship: "" as const,
    aNumber: "",
    ssn: "",
    email: "",
    phone: "",
  };
}

function blankBio() {
  return {
    ethnicity: "" as const,
    race: [],
    heightFeet: "",
    heightInches: "",
    weightPounds: "",
    eye: "",
    hair: "",
  };
}

export function blankParents(): Intake["parents"] {
  const roles: PersonRole[] = ["petitioner", "beneficiary"];
  const which = ["mother", "father"] as const;
  return roles.flatMap((personRole) =>
    which.map((parent) => ({
      personRole,
      which: parent,
      givenName: "",
      familyName: "",
      birthCountry: "",
      deceased: "unanswered" as const,
    })),
  );
}

export function emptyIntake(): Intake {
  return {
    version: 1,
    source: "user",
    selectedForms: [],
    filingMethod: "paper",
    disclaimerAckAt: null,
    petitioner: blankPerson(),
    beneficiary: blankPerson(),
    marriage: {
      date: { ...blankDate },
      city: "",
      country: "",
      liveTogether: "unanswered",
    },
    priorMarriages: [],
    parents: blankParents(),
    addresses: [],
    employment: [],
    biographics: {
      petitioner: blankBio(),
      beneficiary: blankBio(),
    },
    immigration: {
      classOfAdmission: "",
      i94Number: "",
      arrival: { ...blankDate },
      portOfEntry: "",
      passportNumber: "",
      passportCountry: "",
      passportExpiry: { ...blankDate },
      currentStatus: "",
    },
    eligibility: ELIGIBILITY_IDS.map((id) => ({
      id,
      answer: "unanswered",
      explanation: "",
    })),
    sponsor: {
      householdSize: "",
      currentIncome: "",
      taxYear: "",
      taxIncome: "",
    },
    documents: [],
  };
}
