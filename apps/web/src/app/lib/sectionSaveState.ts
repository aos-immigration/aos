export type SectionSaveState = "saved" | "not-saved";
export type GroupSaveState = "saved" | "partial" | "empty";

export type IntakeSnapshot = {
  petitionerGivenName: string;
  petitionerFamilyName: string;
  petitionerAddressCount: number;
  petitionerEmploymentCount: number;
  beneficiaryAddressCount: number;
};

const SAVE_CHECKS: Record<string, (snapshot: IntakeSnapshot) => boolean> = {
  "/sections/petitioner": (snapshot) =>
    snapshot.petitionerGivenName.trim() !== "" &&
    snapshot.petitionerFamilyName.trim() !== "",
  "/sections/petitioner/address": (snapshot) => snapshot.petitionerAddressCount > 0,
  "/sections/petitioner/employment": (snapshot) => snapshot.petitionerEmploymentCount > 0,
  "/sections/beneficiary/address": (snapshot) => snapshot.beneficiaryAddressCount > 0,
};

export const PERSISTABLE_SECTION_HREFS = Object.keys(SAVE_CHECKS);

export function sectionSaveState(href: string, snapshot: IntakeSnapshot): SectionSaveState {
  const check = SAVE_CHECKS[href];
  if (!check || !check(snapshot)) {
    return "not-saved";
  }
  return "saved";
}

export function savedSectionCount(snapshot: IntakeSnapshot): number {
  return PERSISTABLE_SECTION_HREFS.filter(
    (href) => sectionSaveState(href, snapshot) === "saved",
  ).length;
}

export function groupSaveState(
  hrefs: readonly string[],
  snapshot: IntakeSnapshot,
): GroupSaveState {
  const saved = hrefs.filter((href) => sectionSaveState(href, snapshot) === "saved").length;
  if (saved === 0) {
    return "empty";
  }
  if (saved === hrefs.length) {
    return "saved";
  }
  return "partial";
}

export function draftLabel(snapshot: IntakeSnapshot): { initials: string; name: string } {
  const given = snapshot.petitionerGivenName.trim();
  const family = snapshot.petitionerFamilyName.trim();
  if (!given || !family) {
    return { initials: "", name: "Not saved yet" };
  }
  const givenInitial = given.charAt(0).toUpperCase();
  const familyInitial = family.charAt(0).toUpperCase();
  return { initials: `${givenInitial}${familyInitial}`, name: `${given} ${family}` };
}
