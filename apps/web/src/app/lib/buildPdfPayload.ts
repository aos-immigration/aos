/**
 * Shared utility to build the I-130 PDF fill payload from Convex data.
 *
 * Extracted from IntakeFlow.tsx so both the legacy intake wizard and the
 * new "Review Package" button in the header can generate PDFs.
 */

// ── Convex row shapes (only the fields we need) ──

export type PetitionerBasics = {
  givenName: string;
  middleName?: string;
  familyName: string;
  dateOfBirth: { month: string; day: string; year: string };
  relationship: string;
};

export type AddressRow = {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  startMonth: string;
  startYear: string;
  endMonth?: string;
  endYear?: string;
  isCurrent: boolean;
  addressType: string; // "mailing" | "physical"
  sortOrder: number;
};

export type EmploymentRow = {
  status: string;
  employerName: string;
  jobTitle: string;
  city?: string;
  state?: string;
  country: string;
  fromMonth: string;
  fromYear: string;
  toMonth?: string;
  toYear?: string;
  isCurrent: boolean;
  sortOrder: number;
};

// ── Helpers ──

function formatDob(dob: { month: string; day: string; year: string }): string {
  if (!dob.month || !dob.day || !dob.year) return "";
  return `${dob.month}/${dob.day.padStart(2, "0")}/${dob.year}`;
}

function formatMonthYear(month: string, year: string): string {
  if (!month || !year) return "";
  return `${month}/${year}`;
}

function formatTimeline(entry: {
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
  isCurrent: boolean;
  fromMonth?: string;
  fromYear?: string;
  toMonth?: string;
  toYear?: string;
}): string {
  const sm = entry.startMonth ?? entry.fromMonth ?? "";
  const sy = entry.startYear ?? entry.fromYear ?? "";
  const em = entry.endMonth ?? entry.toMonth ?? "";
  const ey = entry.endYear ?? entry.toYear ?? "";
  const start = formatMonthYear(sm, sy);
  const end = entry.isCurrent ? "Present" : formatMonthYear(em, ey);
  if (!start && !end) return "";
  return `${start || "Unknown"} to ${end || "Unknown"}`;
}

function addressFields(
  entry: AddressRow | undefined,
  prefix: string,
  include = true,
): Record<string, string> {
  if (!include || !entry) return {};
  return {
    [`${prefix}_StreetNumberName[0]`]: entry.street || "",
    [`${prefix}_AptSteFlrNumber[0]`]: entry.unit || "",
    [`${prefix}_CityOrTown[0]`]: entry.city || "",
    [`${prefix}_State[0]`]: entry.state || "",
    [`${prefix}_ZipCode[0]`]: entry.zip || "",
    [`${prefix}_PostalCode[0]`]: entry.zip || "",
    [`${prefix}_Country[0]`]: entry.country || "",
  };
}

// ── Main builder ──

export function buildPdfPayload(
  basics: PetitionerBasics | null | undefined,
  addresses: AddressRow[],
  _employment: EmploymentRow[],
): { fields: Record<string, string>; checkboxes: Record<string, boolean> } {
  if (!basics) {
    return { fields: {}, checkboxes: {} };
  }

  const relationshipMap: Record<string, string> = {
    spouse: "form1[0].#subform[0].Pt1Line1_Spouse[0]",
    parent: "form1[0].#subform[0].Pt1Line1_Parent[0]",
    child: "form1[0].#subform[0].Pt1Line1_Child[0]",
    sibling: "form1[0].#subform[0].Pt1Line1_Siblings[0]",
  };

  // Separate mailing vs physical addresses, sorted by sortOrder
  const sorted = [...addresses].sort((a, b) => a.sortOrder - b.sortOrder);
  const mailingAddresses = sorted.filter((a) => a.addressType === "mailing");
  const physicalAddresses = sorted.filter((a) => a.addressType === "physical");

  const mailingAddress = mailingAddresses[0];
  const mailingSameAsPhysical = mailingAddresses.length === 0;

  // If no explicit mailing address, use first physical as mailing
  const effectiveMailing = mailingAddress ?? physicalAddresses[0];
  const physicalForForm = mailingSameAsPhysical
    ? physicalAddresses.slice(1)
    : physicalAddresses;
  const physicalAddress1 = mailingSameAsPhysical ? undefined : physicalForForm[0];
  const physicalAddress2 = mailingSameAsPhysical
    ? physicalForForm[0]
    : physicalForForm[1];

  // Overflow addresses for additional info
  const overflowStart = mailingSameAsPhysical ? 1 : 2;
  const overflowAddresses = physicalForForm.slice(overflowStart);
  const lines: string[] = [];
  overflowAddresses.forEach((entry, index) => {
    const addr = [entry.street, entry.unit, entry.city, entry.state, entry.zip, entry.country]
      .filter(Boolean)
      .join(", ");
    const timeline = formatTimeline(entry);
    lines.push(
      `Part 2, Item 12-14 (Physical address history continued) ${index + 1}: ${addr || "Address missing"} (${timeline || "Dates missing"})`,
    );
  });
  const additionalInfo = lines.join("\n");

  return {
    fields: {
      "form1[0].#subform[0].Pt2Line4a_FamilyName[0]": basics.familyName,
      "form1[0].#subform[0].Pt2Line4b_GivenName[0]": basics.givenName,
      "form1[0].#subform[0].Pt2Line4c_MiddleName[0]": basics.middleName ?? "",
      "form1[0].#subform[1].Pt2Line8_DateofBirth[0]": formatDob(basics.dateOfBirth),
      ...addressFields(effectiveMailing, "form1[0].#subform[1].Pt2Line10"),
      ...addressFields(physicalAddress1, "form1[0].#subform[1].Pt2Line12", !mailingSameAsPhysical),
      ...addressFields(physicalAddress2, "form1[0].#subform[1].Pt2Line14"),
      "form1[0].#subform[11].Pt9Line3a_PageNumber[0]": additionalInfo ? "5" : "",
      "form1[0].#subform[11].Pt9Line3b_PartNumber[0]": additionalInfo ? "2" : "",
      "form1[0].#subform[11].Pt9Line3c_ItemNumber[0]": additionalInfo ? "10-14" : "",
      "form1[0].#subform[11].Pt9Line3d_AdditionalInfo[0]": additionalInfo,
    },
    checkboxes: {
      [relationshipMap[basics.relationship] ?? ""]: true,
      ...(mailingSameAsPhysical
        ? { "form1[0].#subform[1].Pt2Line11_Yes[0]": true }
        : { "form1[0].#subform[1].Pt2Line11_No[0]": true }),
    },
  };
}

