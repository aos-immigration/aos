import type { PetitionerBasics } from "./buildPdfPayload";

const PETITIONER_BASICS_DRAFT_KEY = "aos.reviewDraft.petitionerBasics";

type PartialPetitionerDraft = {
  givenName?: string;
  middleName?: string;
  familyName?: string;
  dateOfBirth?: {
    month?: string;
    day?: string;
    year?: string;
  };
  relationship?: string;
};

function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function savePetitionerBasicsDraft(draft: PartialPetitionerDraft): void {
  if (typeof window === "undefined") return;
  const normalized = {
    givenName: toStringOrEmpty(draft.givenName),
    middleName: toStringOrEmpty(draft.middleName),
    familyName: toStringOrEmpty(draft.familyName),
    dateOfBirth: {
      month: toStringOrEmpty(draft.dateOfBirth?.month),
      day: toStringOrEmpty(draft.dateOfBirth?.day),
      year: toStringOrEmpty(draft.dateOfBirth?.year),
    },
    relationship: toStringOrEmpty(draft.relationship),
  };
  window.sessionStorage.setItem(
    PETITIONER_BASICS_DRAFT_KEY,
    JSON.stringify(normalized),
  );
}

export function readPetitionerBasicsDraft(): PetitionerBasics | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PETITIONER_BASICS_DRAFT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PartialPetitionerDraft;
    const givenName = toStringOrEmpty(parsed.givenName).trim();
    const familyName = toStringOrEmpty(parsed.familyName).trim();
    const relationship = toStringOrEmpty(parsed.relationship).trim();
    const month = toStringOrEmpty(parsed.dateOfBirth?.month).trim();
    const day = toStringOrEmpty(parsed.dateOfBirth?.day).trim();
    const year = toStringOrEmpty(parsed.dateOfBirth?.year).trim();

    if (!givenName || !familyName || !relationship || !month || !day || !year) {
      return null;
    }

    return {
      givenName,
      middleName: toStringOrEmpty(parsed.middleName).trim() || undefined,
      familyName,
      dateOfBirth: { month, day, year },
      relationship,
    };
  } catch {
    return null;
  }
}
