export const DEMO_COOKIE = "aos_demo";

export const DEMO_BANNER =
  "Demo only. Alex Demo and Jamie Demo are a fake couple. Nothing here is saved to an account, and this is not a real filing.";

export const demoPetitioner = {
  givenName: "Alex",
  middleName: "Q",
  familyName: "Demo",
  dateOfBirth: { month: "01", day: "15", year: "1990" },
  placeOfBirth: "Sample City",
  citizenshipStatus: "U.S. citizen (sample)",
  relationship: "Spouse (sample)",
  email: "alex.demo@example.com",
  phone: "555-0100",
  ssnMask: "•••-••-0000",
  aNumberMask: "A••••0000",
};

export const demoBeneficiary = {
  givenName: "Jamie",
  familyName: "Demo",
  relationship: "Spouse of Alex Demo",
};

export const demoAddresses = [
  {
    who: "Alex Demo",
    street: "1 Demo Lane",
    city: "Sample City",
    state: "CA",
    zip: "00000",
    from: "01/2020",
    to: "present",
  },
  {
    who: "Jamie Demo",
    street: "2 Sample Street",
    city: "Sample City",
    state: "CA",
    zip: "00000",
    from: "06/2021",
    to: "present",
  },
];

export function demoPdfBasics() {
  return {
    givenName: demoPetitioner.givenName,
    middleName: demoPetitioner.middleName,
    familyName: demoPetitioner.familyName,
    dateOfBirth: demoPetitioner.dateOfBirth,
    relationship: "spouse",
  };
}

export function demoPdfAddress() {
  return {
    street: "1 Demo Lane",
    city: "Sample City",
    state: "CA",
    zip: "00000",
    country: "United States",
    startMonth: "01",
    startYear: "2020",
    isCurrent: true,
    addressType: "physical",
    sortOrder: 0,
  };
}

export const demoEmployment = {
  who: "Alex Demo",
  employerName: "Demo Cafe",
  jobTitle: "Sample role",
  city: "Sample City",
  from: "01/2020",
  to: "present",
};
