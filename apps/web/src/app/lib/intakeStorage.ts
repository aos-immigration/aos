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

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export { createId };

export const createEmptyAddress = (): AddressEntry => ({
  id: createId(),
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  startMonth: "",
  startYear: "",
  isCurrent: true,
});
