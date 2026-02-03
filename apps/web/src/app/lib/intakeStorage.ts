export type MonthValue =
  | ""
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12";

export type RelationshipValue = "" | "spouse" | "parent" | "child" | "sibling";

export type EmploymentStatus = "" | "employed" | "unemployed" | "student" | "other";

export type AddressEntry = {
  id: string;
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  startMonth: MonthValue;
  startYear: string;
  startDay?: string;
  endMonth?: MonthValue;
  endYear?: string;
  endDay?: string;
  isCurrent: boolean;
  gapExplanation?: string;
  notes?: string;
};

export type EmploymentEntry = {
  id: string;
  status: EmploymentStatus;
  employerName: string;
  jobTitle: string;
  city: string;
  state: string;
  country: string;
  fromMonth: MonthValue;
  fromYear: string;
  toMonth: MonthValue;
  toYear: string;
  isCurrent: boolean;
  notes: string;
};

export type IntakeData = {
  basics: {
    relationship: RelationshipValue;
    petitioner: {
      givenName: string;
      middleName: string;
      familyName: string;
    };
    dateOfBirth: {
      month: MonthValue;
      day: string;
      year: string;
    };
  };
  contact: {
    email: string;
    phone: string;
  };
  mailingSameAsPhysical: boolean;
  mailingAddress: AddressEntry;
  addresses: AddressEntry[];
  employment: EmploymentEntry[];
};

const STORAGE_KEY = "aos:intake:v1";

const emptyAddress = (): AddressEntry => ({
  id: createId(),
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  startMonth: "",
  startYear: "",
  isCurrent: false,
});

const emptyEmployment = (): EmploymentEntry => ({
  id: createId(),
  status: "",
  employerName: "",
  jobTitle: "",
  city: "",
  state: "",
  country: "United States",
  fromMonth: "",
  fromYear: "",
  toMonth: "",
  toYear: "",
  isCurrent: false,
  notes: "",
});

export const defaultIntakeData = (): IntakeData => ({
  basics: {
    relationship: "spouse",
    petitioner: {
      givenName: "",
      middleName: "",
      familyName: "",
    },
    dateOfBirth: {
      month: "",
      day: "",
      year: "",
    },
  },
  contact: {
    email: "",
    phone: "",
  },
  mailingSameAsPhysical: true,
  mailingAddress: emptyAddress(),
  addresses: [emptyAddress()],
  employment: [emptyEmployment()],
});

export const createEmptyAddress = emptyAddress;
export const createEmptyEmployment = emptyEmployment;

export function loadIntake(): IntakeData {
  if (typeof window === "undefined") {
    return defaultIntakeData();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultIntakeData();
    }
    const parsed = JSON.parse(raw) as IntakeData;
    return normalizeIntake(parsed);
  } catch {
    return defaultIntakeData();
  }
}

export function saveIntake(data: IntakeData) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearIntake() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

const normalizeIntake = (input: IntakeData): IntakeData => {
  const addresses = Array.isArray(input.addresses)
    ? input.addresses
    : [emptyAddress()];
  const employment = Array.isArray(input.employment)
    ? input.employment
    : [emptyEmployment()];

  return {
    basics: input.basics ?? defaultIntakeData().basics,
    contact: input.contact ?? defaultIntakeData().contact,
    mailingSameAsPhysical:
      typeof input.mailingSameAsPhysical === "boolean"
        ? input.mailingSameAsPhysical
        : defaultIntakeData().mailingSameAsPhysical,
    mailingAddress: input.mailingAddress ?? defaultIntakeData().mailingAddress,
    addresses: addresses.length ? addresses : [emptyAddress()],
    employment: employment.length ? employment : [emptyEmployment()],
  };
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export { createId };

export function loadAddressHistory(): AddressEntry[] {
  const data = loadIntake();
  return data.addresses;
}

export function saveAddressHistory(addresses: AddressEntry[]): void {
  const data = loadIntake();
  data.addresses = addresses;
  saveIntake(data);
}

export function addAddress(address: AddressEntry): void {
  const data = loadIntake();
  data.addresses.push(address);
  saveIntake(data);
}

export function updateAddress(id: string, updates: Partial<AddressEntry>): void {
  const data = loadIntake();
  data.addresses = data.addresses.map((entry) =>
    entry.id === id ? { ...entry, ...updates } : entry
  );
  saveIntake(data);
}

export function removeAddress(id: string): void {
  const data = loadIntake();
  data.addresses = data.addresses.filter((entry) => entry.id !== id);
  if (data.addresses.length === 0) {
    data.addresses = [emptyAddress()];
  }
  saveIntake(data);
}
