/**
 * pdfFieldMappings.ts
 *
 * Maps intake data collected in the UI to the actual PDF field names for each
 * USCIS form.  The field names were discovered by querying the /fields/:slug
 * endpoint which reads them with pikepdf from the Forms/ directory.
 *
 * Exports:
 *  - FormFieldMapping          type describing one form's mapping metadata
 *  - FORM_FIELD_MAPPINGS       complete mapping constant for all 5 forms
 *  - buildFormPayload()        converts IntakeData → { fields, checkboxes }
 *  - getAvailableForms()       list of supported form slugs + display names
 *  - getAddressFieldsForForm() which address fields a form uses (for verification UI)
 */

import type {
  AddressEntry,
  IntakeData,
  MonthValue,
} from "./intakeStorage";

// ---------------------------------------------------------------------------
// Date formatting helpers
// ---------------------------------------------------------------------------

/** mm/dd/yyyy – the standard USCIS date format used by most date fields. */
export function formatUSCISDate(
  month: MonthValue | string,
  day: string,
  year: string
): string {
  if (!month || !day || !year) return "";
  return `${month}/${day.padStart(2, "0")}/${year}`;
}

/** mm/yyyy – used for timeline-style "from/to" fields. */
export function formatMonthYear(month: MonthValue | string, year: string): string {
  if (!month || !year) return "";
  return `${month}/${year}`;
}

/** Produces a "mm/yyyy to mm/yyyy" or "mm/yyyy to Present" string. */
export function formatTimeline(entry: {
  startMonth: MonthValue;
  startYear: string;
  endMonth?: MonthValue;
  endYear?: string;
  isCurrent: boolean;
}): string {
  const start = formatMonthYear(entry.startMonth, entry.startYear);
  const end = entry.isCurrent
    ? "Present"
    : formatMonthYear(entry.endMonth ?? "", entry.endYear ?? "");
  if (!start && !end) return "";
  return `${start || "Unknown"} to ${end || "Unknown"}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Describes which address-oriented PDF field groups a form has. */
export type AddressFieldGroup = {
  /** Human label, e.g. "Mailing address" */
  label: string;
  /** The PDF field name prefix (before _StreetNumberName, etc.) */
  prefix: string;
};

export type FormFieldMapping = {
  slug: string;
  displayName: string;
  /** Address groups this form supports natively (before overflow). */
  addressGroups: {
    mailingAddress?: AddressFieldGroup;
    physicalAddress?: AddressFieldGroup;
    previousAddresses: AddressFieldGroup[];
  };
  /** Additional-information / overflow field names. */
  additionalInfo: {
    pageNumberField?: string;
    partNumberField?: string;
    itemNumberField?: string;
    textField?: string;
  };
};

// ---------------------------------------------------------------------------
// Per-form address-field helper: builds `Record<string, string>` for one
// address entry given a field-name prefix.
// ---------------------------------------------------------------------------

/** Standard I-130 style address fields (Pt2Line10, Pt2Line12, Pt2Line14). */
function i130AddressFields(
  entry: AddressEntry | undefined,
  prefix: string,
  include = true
): Record<string, string> {
  if (!include || !entry) return {};
  return {
    [`${prefix}_StreetNumberName[0]`]: entry.street ?? "",
    [`${prefix}_AptSteFlrNumber[0]`]: entry.unit ?? "",
    [`${prefix}_CityOrTown[0]`]: entry.city ?? "",
    [`${prefix}_State[0]`]: entry.state ?? "",
    [`${prefix}_ZipCode[0]`]: entry.zip ?? "",
    [`${prefix}_PostalCode[0]`]: entry.zip ?? "",
    [`${prefix}_Country[0]`]: entry.country ?? "",
  };
}

/**
 * I-130A style address fields – they use letter suffixes (a/b/c/d/e/f/g/h)
 * instead of underscore names. e.g. Pt1Line4a_StreetNumberName
 */
function i130aAddressFields(
  entry: AddressEntry | undefined,
  prefix: string,
  include = true
): Record<string, string> {
  if (!include || !entry) return {};
  return {
    [`${prefix}a_StreetNumberName[0]`]: entry.street ?? "",
    [`${prefix}b_AptSteFlrNumber[0]`]: entry.unit ?? "",
    [`${prefix}c_CityOrTown[0]`]: entry.city ?? "",
    [`${prefix}d_State[0]`]: entry.state ?? "",
    [`${prefix}e_ZipCode[0]`]: entry.zip ?? "",
    [`${prefix}f_Province[0]`]: "",
    [`${prefix}g_PostalCode[0]`]: entry.zip ?? "",
    [`${prefix}h_Country[0]`]: entry.country ?? "",
  };
}

/**
 * I-485 US-address style for the mailing address (Pt1Line18 block on
 * subform[2]).
 */
function i485MailingAddressFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return {
    "form1[0].#subform[2].Pt1Line18_StreetNumberName[0]": entry.street ?? "",
    "form1[0].#subform[2].Pt1Line18US_AptSteFlrNumber[0]": entry.unit ?? "",
    "form1[0].#subform[2].Pt1Line18_CityOrTown[0]": entry.city ?? "",
    "form1[0].#subform[2].Pt1Line18_State[0]": entry.state ?? "",
    "form1[0].#subform[2].Pt1Line18_ZipCode[0]": entry.zip ?? "",
  };
}

/** I-485 "current physical" address (right below mailing on same page). */
function i485PhysicalAddressFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return {
    "form1[0].#subform[2].Pt1Line18_CurrentStreetNumberName[0]": entry.street ?? "",
    "form1[0].#subform[2].Pt1Line18_CurrentAptSteFlrNumber[0]": entry.unit ?? "",
    "form1[0].#subform[2].Pt1Line18_CurrentCityOrTown[0]": entry.city ?? "",
    "form1[0].#subform[2].Pt1Line18_CurrentState[0]": entry.state ?? "",
    "form1[0].#subform[2].Pt1Line18_CurrentZipCode[0]": entry.zip ?? "",
  };
}

/** I-485 "prior" address – the first previous address slot on subform[3]. */
function i485PriorAddressFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return {
    "form1[0].#subform[3].Pt1Line18_PriorStreetName[0]": entry.street ?? "",
    "form1[0].#subform[3].Pt1Line18_PriorAddress_Number[0]": entry.unit ?? "",
    "form1[0].#subform[3].Pt1Line18_PriorCity[0]": entry.city ?? "",
    "form1[0].#subform[3].Pt1Line18_PriorState[0]": entry.state ?? "",
    "form1[0].#subform[3].Pt1Line18_PriorZipCode[0]": entry.zip ?? "",
    "form1[0].#subform[3].Pt1Line18_PriorProvince[0]": "",
    "form1[0].#subform[3].Pt1Line18_PriorPostalCode[0]": "",
    "form1[0].#subform[3].Pt1Line18_PriorCountry[0]": entry.country ?? "",
    "form1[0].#subform[3].Pt1Line18_PriorDateFrom[0]": formatMonthYear(
      entry.startMonth,
      entry.startYear
    ),
    "form1[0].#subform[3].Pt1Line18PriorDateTo[0]": entry.isCurrent
      ? "Present"
      : formatMonthYear(entry.endMonth ?? "", entry.endYear ?? ""),
  };
}

/** I-485 "recent" (2nd previous) address slot on subform[3]. */
function i485RecentAddressFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return {
    "form1[0].#subform[3].Pt1Line18_RecentStreetName[0]": entry.street ?? "",
    "form1[0].#subform[3].Pt1Line18_RecentNumber[0]": entry.unit ?? "",
    "form1[0].#subform[3].Pt1Line18_RecentCity[0]": entry.city ?? "",
    "form1[0].#subform[3].Pt1Line18_RecentState[0]": entry.state ?? "",
    "form1[0].#subform[3].Pt1Line18_RecentZipCode[0]": entry.zip ?? "",
    "form1[0].#subform[3].Pt1Line18_RecentProvince[0]": "",
    "form1[0].#subform[3].Pt1Line18_RecentPostalCode[0]": "",
    "form1[0].#subform[3].Pt1Line18_RecentCountry[0]": entry.country ?? "",
    "form1[0].#subform[3].Pt1Line18_RecentDateFrom[0]": formatMonthYear(
      entry.startMonth,
      entry.startYear
    ),
    "form1[0].#subform[3].Pt1Line18_RecentDateTo[0]": entry.isCurrent
      ? "Present"
      : formatMonthYear(entry.endMonth ?? "", entry.endYear ?? ""),
  };
}

/** I-765 mailing address (Pt2Line5 is mailing, uses "Line4b" for street). */
function i765MailingAddressFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return {
    "form1[0].Page2[0].Line4b_StreetNumberName[0]": entry.street ?? "",
    "form1[0].Page2[0].Pt2Line5_AptSteFlrNumber[0]": entry.unit ?? "",
    "form1[0].Page2[0].Pt2Line5_CityOrTown[0]": entry.city ?? "",
    "form1[0].Page2[0].Pt2Line5_State[0]": entry.state ?? "",
    "form1[0].Page2[0].Pt2Line5_ZipCode[0]": entry.zip ?? "",
  };
}

/** I-765 physical address (Pt2Line7). */
function i765PhysicalAddressFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return {
    "form1[0].Page2[0].Pt2Line7_StreetNumberName[0]": entry.street ?? "",
    "form1[0].Page2[0].Pt2Line7_AptSteFlrNumber[0]": entry.unit ?? "",
    "form1[0].Page2[0].Pt2Line7_CityOrTown[0]": entry.city ?? "",
    "form1[0].Page2[0].Pt2Line7_State[0]": entry.state ?? "",
    "form1[0].Page2[0].Pt2Line7_ZipCode[0]": entry.zip ?? "",
  };
}

/** I-131 mailing address (Part2_Line3). */
function i131MailingAddressFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return {
    "form1[0].P5[0].Part2_Line3_StreetNumberName[0]": entry.street ?? "",
    "form1[0].P5[0].Part2_Line3_AptSteFlrNumber[0]": entry.unit ?? "",
    "form1[0].P5[0].Part2_Line3_CityTown[0]": entry.city ?? "",
    "form1[0].P5[0].Part2_Line3_State[0]": entry.state ?? "",
    "form1[0].P5[0].Part2_Line3_ZipCode[0]": entry.zip ?? "",
    "form1[0].P5[0].Part2_Line3_Province[0]": "",
    "form1[0].P5[0].Part2_Line3_PostalCode[0]": "",
    "form1[0].P5[0].Part2_Line3_Country[0]": entry.country ?? "",
  };
}

/** I-131 safe address / physical address (Part2_Line4). */
function i131PhysicalAddressFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return {
    "form1[0].P5[0].Part2_Line4_StreetNumberName[0]": entry.street ?? "",
    "form1[0].P5[0].Part2_Line4_AptSteFlrNumber[0]": entry.unit ?? "",
    "form1[0].P5[0].Part2_Line4_CityTown[0]": entry.city ?? "",
    "form1[0].P5[0].Part2_Line4_State[0]": entry.state ?? "",
    "form1[0].P5[0].Part2_Line4_ZipCode[0]": entry.zip ?? "",
    "form1[0].P5[0].Part2_Line4_Province[0]": "",
    "form1[0].P5[0].Part2_Line4_PostalCode[0]": "",
    "form1[0].P5[0].Part2_Line4_Country[0]": entry.country ?? "",
  };
}

// ---------------------------------------------------------------------------
// I-130A address group fields with letter-suffix style
// ---------------------------------------------------------------------------

/** I-130A Part 1, Line 4 – beneficiary's current physical address. */
function i130aBeneficiaryPhysicalFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return i130aAddressFields(
    entry,
    "form1[0].#subform[0].Pt1Line4"
  );
}

/** I-130A Part 1, Line 6 – beneficiary's mailing address. */
function i130aBeneficiaryMailingFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return i130aAddressFields(
    entry,
    "form1[0].#subform[0].Pt1Line6"
  );
}

/** I-130A Part 1, Line 8 – beneficiary address abroad. */
function i130aBeneficiaryAbroadFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return {
    "form1[0].#subform[0].Pt1Line8a_StreetNumberName[0]": entry.street ?? "",
    "form1[0].#subform[0].Pt1Line8b_AptSteFlrNumber[0]": entry.unit ?? "",
    "form1[0].#subform[0].Pt1Line8c_CityOrTown[0]": entry.city ?? "",
    "form1[0].#subform[0].Pt1Line8d_Province[0]": "",
    "form1[0].#subform[0].Pt1Line8e_PostalCode[0]": entry.zip ?? "",
    "form1[0].#subform[0].Pt1Line8f_Country[0]": entry.country ?? "",
  };
}

/** I-130A Part 2, Line 2 – sponsor's address. */
function i130aSponsorAddressFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return {
    "form1[0].#subform[1].Pt2Line2a_StreetNumberName[0]": entry.street ?? "",
    "form1[0].#subform[1].Pt2Line2b_AptSteFlrNumber[0]": entry.unit ?? "",
    "form1[0].#subform[1].Pt2Line2c_CityOrTown[0]": entry.city ?? "",
    "form1[0].#subform[1].Pt2Line2d_State[0]": entry.state ?? "",
    "form1[0].#subform[1].Pt2Line2e_ZipCode[0]": entry.zip ?? "",
    "form1[0].#subform[1].Pt2Line2f_Province[0]": "",
    "form1[0].#subform[1].Pt2Line2g_PostalCode[0]": "",
    "form1[0].#subform[1].Pt2Line2h_Country[0]": entry.country ?? "",
  };
}

/** I-130A Part 2, Line 6 – sponsor's employment address. */
function i130aSponsorEmploymentAddressFields(
  entry: AddressEntry | undefined
): Record<string, string> {
  if (!entry) return {};
  return {
    "form1[0].#subform[1].Pt2Line6_StreetNumberName[0]": entry.street ?? "",
    "form1[0].#subform[1].Pt2Line6_AptSteFlrNumber[0]": entry.unit ?? "",
    "form1[0].#subform[1].Pt2Line6_CityOrTown[0]": entry.city ?? "",
    "form1[0].#subform[1].Pt2Line6_State[0]": entry.state ?? "",
    "form1[0].#subform[1].Pt2Line6_ZipCode[0]": entry.zip ?? "",
    "form1[0].#subform[1].Pt2Line6_Province[0]": "",
    "form1[0].#subform[1].Pt2Line6_PostalCode[0]": "",
    "form1[0].#subform[1].Pt2Line6_Country[0]": entry.country ?? "",
  };
}

// ---------------------------------------------------------------------------
// FORM_FIELD_MAPPINGS – metadata constant
// ---------------------------------------------------------------------------

export const FORM_FIELD_MAPPINGS: Record<string, FormFieldMapping> = {
  "i-130": {
    slug: "i-130",
    displayName: "I-130 Petition for Alien Relative",
    addressGroups: {
      mailingAddress: {
        label: "Mailing address (Pt2, Line 10)",
        prefix: "form1[0].#subform[1].Pt2Line10",
      },
      physicalAddress: {
        label: "Physical address (Pt2, Line 12)",
        prefix: "form1[0].#subform[1].Pt2Line12",
      },
      previousAddresses: [
        {
          label: "Previous physical address (Pt2, Line 14)",
          prefix: "form1[0].#subform[1].Pt2Line14",
        },
      ],
    },
    additionalInfo: {
      pageNumberField: "form1[0].#subform[11].Pt9Line3a_PageNumber[0]",
      partNumberField: "form1[0].#subform[11].Pt9Line3b_PartNumber[0]",
      itemNumberField: "form1[0].#subform[11].Pt9Line3c_ItemNumber[0]",
      textField: "form1[0].#subform[11].Pt9Line3d_AdditionalInfo[0]",
    },
  },

  "i-130a": {
    slug: "i-130a",
    displayName: "I-130A Supplemental Information",
    addressGroups: {
      mailingAddress: {
        label: "Beneficiary mailing address (Pt1, Line 6)",
        prefix: "form1[0].#subform[0].Pt1Line6",
      },
      physicalAddress: {
        label: "Beneficiary physical address (Pt1, Line 4)",
        prefix: "form1[0].#subform[0].Pt1Line4",
      },
      previousAddresses: [
        {
          label: "Sponsor address (Pt2, Line 2)",
          prefix: "form1[0].#subform[1].Pt2Line2",
        },
      ],
    },
    additionalInfo: {
      pageNumberField: "form1[0].#subform[5].Pt7Line3a_PageNumber[0]",
      partNumberField: "form1[0].#subform[5].Pt7Line3b_PartNumber[0]",
      itemNumberField: "form1[0].#subform[5].Pt7Line3c_ItemNumber[0]",
      textField: "form1[0].#subform[5].Pt7Line3d_AdditionalInfo[0]",
    },
  },

  "i-485": {
    slug: "i-485",
    displayName: "I-485 Adjustment of Status",
    addressGroups: {
      mailingAddress: {
        label: "Mailing address (Pt1, Line 18 – US)",
        prefix: "form1[0].#subform[2].Pt1Line18",
      },
      physicalAddress: {
        label: "Physical address (Pt1, Line 18 – Current)",
        prefix: "form1[0].#subform[2].Pt1Line18_Current",
      },
      previousAddresses: [
        {
          label: "Prior address (Pt1, Line 18 – Prior)",
          prefix: "form1[0].#subform[3].Pt1Line18_Prior",
        },
        {
          label: "Recent address (Pt1, Line 18 – Recent)",
          prefix: "form1[0].#subform[3].Pt1Line18_Recent",
        },
      ],
    },
    additionalInfo: {
      textField: "form1[0].#subform[24].P14_Line3_AdditionalInfo[0]",
    },
  },

  "i-765": {
    slug: "i-765",
    displayName: "I-765 Employment Authorization",
    addressGroups: {
      mailingAddress: {
        label: "Mailing address (Pt2, Line 5)",
        prefix: "form1[0].Page2[0].Pt2Line5",
      },
      physicalAddress: {
        label: "Physical address (Pt2, Line 7)",
        prefix: "form1[0].Page2[0].Pt2Line7",
      },
      previousAddresses: [],
    },
    additionalInfo: {
      pageNumberField: "form1[0].Page7[0].Pt6Line3a_PageNumber[0]",
      partNumberField: "form1[0].Page7[0].Pt6Line3b_PartNumber[0]",
      itemNumberField: "form1[0].Page7[0].Pt6Line3c_ItemNumber[0]",
      textField: "form1[0].Page7[0].Pt6Line4d_AdditionalInfo[0]",
    },
  },

  "i-131": {
    slug: "i-131",
    displayName: "I-131 Travel Document",
    addressGroups: {
      mailingAddress: {
        label: "Mailing address (Pt2, Line 3)",
        prefix: "form1[0].P5[0].Part2_Line3",
      },
      physicalAddress: {
        label: "Physical address (Pt2, Line 4)",
        prefix: "form1[0].P5[0].Part2_Line4",
      },
      previousAddresses: [],
    },
    additionalInfo: {
      pageNumberField: "form1[0].#subform[13].Part13_Line3_PageNumber[0]",
      partNumberField: "form1[0].#subform[13].Part13_Line3_PartNumber[0]",
      itemNumberField: "form1[0].#subform[13].Part13_Line3_ItemNumber[0]",
      textField: "form1[0].#subform[13].Part13_Line3_AdditionalInfo[0]",
    },
  },
};

// ---------------------------------------------------------------------------
// Overflow / additional-info builder
// ---------------------------------------------------------------------------

/**
 * Build an additional-info text block for addresses that exceed the number of
 * dedicated address slots on the PDF.  The I-130 uses a specific reference to
 * "Part 2, Item 12-14"; other forms describe it more generically.
 */
function buildAdditionalInfoText(
  overflowAddresses: AddressEntry[],
  formSlug: string
): string {
  if (overflowAddresses.length === 0) return "";

  const lines: string[] = [];
  overflowAddresses.forEach((entry, index) => {
    const address = [
      entry.street,
      entry.unit,
      entry.city,
      entry.state,
      entry.zip,
      entry.country,
    ]
      .filter(Boolean)
      .join(", ");
    const timeline = formatTimeline(entry);

    const prefix =
      formSlug === "i-130"
        ? "Part 2, Item 12-14 (Physical address history continued)"
        : "Address history (continued)";

    lines.push(
      `${prefix} ${index + 1}: ${address || "Address missing"} (${
        timeline || "Dates missing"
      })`
    );
  });

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Resolve which address goes where
// ---------------------------------------------------------------------------

type ResolvedAddresses = {
  mailingAddress: AddressEntry | undefined;
  physicalAddress: AddressEntry | undefined;
  /** Previous addresses that fit in the form's dedicated slots. */
  previousAddresses: AddressEntry[];
  /** Addresses that must go into Additional Information. */
  overflowAddresses: AddressEntry[];
};

function resolveAddresses(
  data: IntakeData,
  formSlug: string
): ResolvedAddresses {
  const mapping = FORM_FIELD_MAPPINGS[formSlug];
  const maxPrevious = mapping?.addressGroups.previousAddresses.length ?? 0;

  const mailingAddress = data.mailingSameAsPhysical
    ? data.addresses[0]
    : data.mailingAddress;

  // When mailing == physical, addresses[0] is the mailing/physical, and only
  // the physical slot is used (the separate physical address is skipped).
  // When they differ, addresses[0] is the physical address.
  const physicalAddress = data.mailingSameAsPhysical
    ? undefined
    : data.addresses[0];

  const previousStart = data.mailingSameAsPhysical ? 1 : 1;
  const allPrevious = data.addresses.slice(previousStart);
  const previousAddresses = allPrevious.slice(0, maxPrevious);
  const overflowAddresses = allPrevious.slice(maxPrevious);

  return {
    mailingAddress,
    physicalAddress,
    previousAddresses,
    overflowAddresses,
  };
}

// ---------------------------------------------------------------------------
// buildFormPayload – the main public function
// ---------------------------------------------------------------------------

export function buildFormPayload(
  formSlug: string,
  data: IntakeData
): { fields: Record<string, string>; checkboxes: Record<string, boolean> } {
  switch (formSlug) {
    case "i-130":
      return buildI130Payload(data);
    case "i-130a":
      return buildI130APayload(data);
    case "i-485":
      return buildI485Payload(data);
    case "i-765":
      return buildI765Payload(data);
    case "i-131":
      return buildI131Payload(data);
    default:
      return { fields: {}, checkboxes: {} };
  }
}

// ---------------------------------------------------------------------------
// I-130
// ---------------------------------------------------------------------------

function buildI130Payload(data: IntakeData): {
  fields: Record<string, string>;
  checkboxes: Record<string, boolean>;
} {
  const relationshipMap: Record<string, string> = {
    spouse: "form1[0].#subform[0].Pt1Line1_Spouse[0]",
    parent: "form1[0].#subform[0].Pt1Line1_Parent[0]",
    child: "form1[0].#subform[0].Pt1Line1_Child[0]",
    sibling: "form1[0].#subform[0].Pt1Line1_Siblings[0]",
  };

  const mailingAddress = data.mailingSameAsPhysical
    ? data.addresses[0]
    : data.mailingAddress;
  const physicalAddresses = data.mailingSameAsPhysical
    ? data.addresses.slice(1)
    : data.addresses;
  const physicalAddress1 = data.mailingSameAsPhysical
    ? undefined
    : physicalAddresses[0];
  const physicalAddress2 = data.mailingSameAsPhysical
    ? physicalAddresses[0]
    : physicalAddresses[1];

  // Overflow: everything past the first two physical addresses
  const overflowStart = data.mailingSameAsPhysical ? 1 : 2;
  const overflowAddresses = physicalAddresses.slice(overflowStart);

  const additionalInfo = buildAdditionalInfoText(overflowAddresses, "i-130");

  const dob = formatUSCISDate(
    data.basics.dateOfBirth.month,
    data.basics.dateOfBirth.day,
    data.basics.dateOfBirth.year
  );

  return {
    fields: {
      "form1[0].#subform[0].Pt2Line4a_FamilyName[0]":
        data.basics.petitioner.familyName,
      "form1[0].#subform[0].Pt2Line4b_GivenName[0]":
        data.basics.petitioner.givenName,
      "form1[0].#subform[0].Pt2Line4c_MiddleName[0]":
        data.basics.petitioner.middleName,
      "form1[0].#subform[1].Pt2Line8_DateofBirth[0]": dob,
      ...i130AddressFields(mailingAddress, "form1[0].#subform[1].Pt2Line10"),
      ...i130AddressFields(
        physicalAddress1,
        "form1[0].#subform[1].Pt2Line12",
        !data.mailingSameAsPhysical
      ),
      ...i130AddressFields(physicalAddress2, "form1[0].#subform[1].Pt2Line14"),
      "form1[0].#subform[11].Pt9Line3a_PageNumber[0]": additionalInfo
        ? "5"
        : "",
      "form1[0].#subform[11].Pt9Line3b_PartNumber[0]": additionalInfo
        ? "2"
        : "",
      "form1[0].#subform[11].Pt9Line3c_ItemNumber[0]": additionalInfo
        ? "10-14"
        : "",
      "form1[0].#subform[11].Pt9Line3d_AdditionalInfo[0]": additionalInfo,
    },
    checkboxes: {
      [relationshipMap[data.basics.relationship] ?? ""]: true,
      ...(data.mailingSameAsPhysical
        ? { "form1[0].#subform[1].Pt2Line11_Yes[0]": true }
        : { "form1[0].#subform[1].Pt2Line11_No[0]": true }),
    },
  };
}

// ---------------------------------------------------------------------------
// I-130A
// ---------------------------------------------------------------------------

function buildI130APayload(data: IntakeData): {
  fields: Record<string, string>;
  checkboxes: Record<string, boolean>;
} {
  const resolved = resolveAddresses(data, "i-130a");
  const additionalInfo = buildAdditionalInfoText(
    resolved.overflowAddresses,
    "i-130a"
  );

  return {
    fields: {
      // Beneficiary physical address (Pt1 Line4)
      ...i130aBeneficiaryPhysicalFields(
        resolved.physicalAddress ?? resolved.mailingAddress
      ),
      // Beneficiary mailing address (Pt1 Line6)
      ...i130aBeneficiaryMailingFields(resolved.mailingAddress),
      // Sponsor address (Pt2 Line2) – use mailing as sponsor's addr
      ...i130aSponsorAddressFields(resolved.mailingAddress),
      // Additional information
      ...(additionalInfo
        ? {
            "form1[0].#subform[5].Pt7Line3a_PageNumber[0]": "1",
            "form1[0].#subform[5].Pt7Line3b_PartNumber[0]": "1",
            "form1[0].#subform[5].Pt7Line3c_ItemNumber[0]": "4-8",
            "form1[0].#subform[5].Pt7Line3d_AdditionalInfo[0]": additionalInfo,
          }
        : {}),
    },
    checkboxes: {},
  };
}

// ---------------------------------------------------------------------------
// I-485
// ---------------------------------------------------------------------------

function buildI485Payload(data: IntakeData): {
  fields: Record<string, string>;
  checkboxes: Record<string, boolean>;
} {
  const resolved = resolveAddresses(data, "i-485");

  // I-485 has 2 previous address slots: Prior + Recent
  const priorAddr = resolved.previousAddresses[0];
  const recentAddr = resolved.previousAddresses[1];

  // Overflow: addresses beyond the 2 previous slots
  const additionalInfo = buildAdditionalInfoText(
    resolved.overflowAddresses,
    "i-485"
  );

  const dob = formatUSCISDate(
    data.basics.dateOfBirth.month,
    data.basics.dateOfBirth.day,
    data.basics.dateOfBirth.year
  );

  return {
    fields: {
      ...i485MailingAddressFields(resolved.mailingAddress),
      ...i485PhysicalAddressFields(
        data.mailingSameAsPhysical ? undefined : resolved.physicalAddress
      ),
      ...i485PriorAddressFields(priorAddr),
      ...i485RecentAddressFields(recentAddr),
      ...(additionalInfo
        ? {
            "form1[0].#subform[24].P14_Line3_AdditionalInfo[0]":
              additionalInfo,
          }
        : {}),
    },
    checkboxes: {
      ...(data.mailingSameAsPhysical
        ? { "form1[0].#subform[2].Pt1Line18_YN[0]": true }
        : { "form1[0].#subform[2].Pt1Line18_YN[1]": true }),
      ...(resolved.previousAddresses.length > 0
        ? { "form1[0].#subform[3].Pt1Line18_last5yrs_YN[0]": true }
        : { "form1[0].#subform[3].Pt1Line18_last5yrs_YN[1]": true }),
    },
  };
}

// ---------------------------------------------------------------------------
// I-765
// ---------------------------------------------------------------------------

function buildI765Payload(data: IntakeData): {
  fields: Record<string, string>;
  checkboxes: Record<string, boolean>;
} {
  const resolved = resolveAddresses(data, "i-765");

  // I-765 has no dedicated previous-address slots; everything overflows
  const allPrevious = [
    ...resolved.previousAddresses,
    ...resolved.overflowAddresses,
  ];
  const additionalInfo = buildAdditionalInfoText(allPrevious, "i-765");

  return {
    fields: {
      ...i765MailingAddressFields(resolved.mailingAddress),
      ...i765PhysicalAddressFields(
        data.mailingSameAsPhysical ? undefined : resolved.physicalAddress
      ),
      ...(additionalInfo
        ? {
            "form1[0].Page7[0].Pt6Line3a_PageNumber[0]": "2",
            "form1[0].Page7[0].Pt6Line3b_PartNumber[0]": "2",
            "form1[0].Page7[0].Pt6Line3c_ItemNumber[0]": "5-7",
            "form1[0].Page7[0].Pt6Line4d_AdditionalInfo[0]": additionalInfo,
          }
        : {}),
    },
    checkboxes: {},
  };
}

// ---------------------------------------------------------------------------
// I-131
// ---------------------------------------------------------------------------

function buildI131Payload(data: IntakeData): {
  fields: Record<string, string>;
  checkboxes: Record<string, boolean>;
} {
  const resolved = resolveAddresses(data, "i-131");

  // I-131 has no dedicated previous-address slots; everything overflows
  const allPrevious = [
    ...resolved.previousAddresses,
    ...resolved.overflowAddresses,
  ];
  const additionalInfo = buildAdditionalInfoText(allPrevious, "i-131");

  return {
    fields: {
      ...i131MailingAddressFields(resolved.mailingAddress),
      ...i131PhysicalAddressFields(
        data.mailingSameAsPhysical ? undefined : resolved.physicalAddress
      ),
      ...(additionalInfo
        ? {
            "form1[0].#subform[13].Part13_Line3_PageNumber[0]": "5",
            "form1[0].#subform[13].Part13_Line3_PartNumber[0]": "2",
            "form1[0].#subform[13].Part13_Line3_ItemNumber[0]": "3-4",
            "form1[0].#subform[13].Part13_Line3_AdditionalInfo[0]":
              additionalInfo,
          }
        : {}),
    },
    checkboxes: {},
  };
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export type FormInfo = {
  slug: string;
  displayName: string;
};

/** Returns the list of all supported forms with display names. */
export function getAvailableForms(): FormInfo[] {
  return Object.values(FORM_FIELD_MAPPINGS).map(({ slug, displayName }) => ({
    slug,
    displayName,
  }));
}

export type AddressFieldInfo = {
  category: "mailing" | "physical" | "previous" | "overflow";
  label: string;
  prefix: string;
};

/**
 * Returns the address field groups used by a form – useful for the
 * verification UI to show which addresses map to which PDF sections.
 */
export function getAddressFieldsForForm(
  formSlug: string
): AddressFieldInfo[] {
  const mapping = FORM_FIELD_MAPPINGS[formSlug];
  if (!mapping) return [];

  const result: AddressFieldInfo[] = [];

  if (mapping.addressGroups.mailingAddress) {
    result.push({
      category: "mailing",
      label: mapping.addressGroups.mailingAddress.label,
      prefix: mapping.addressGroups.mailingAddress.prefix,
    });
  }

  if (mapping.addressGroups.physicalAddress) {
    result.push({
      category: "physical",
      label: mapping.addressGroups.physicalAddress.label,
      prefix: mapping.addressGroups.physicalAddress.prefix,
    });
  }

  mapping.addressGroups.previousAddresses.forEach((prev) => {
    result.push({
      category: "previous",
      label: prev.label,
      prefix: prev.prefix,
    });
  });

  if (mapping.additionalInfo.textField) {
    result.push({
      category: "overflow",
      label: "Additional information / overflow addresses",
      prefix: mapping.additionalInfo.textField,
    });
  }

  return result;
}
