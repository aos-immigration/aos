import type { AddressEntry } from "./intakeStorage";
import { addressSchema } from "./schemas/addressSchema";
import { monthYearToDate } from "./dateUtils";

export type ValidationErrors = Record<string, string>;

// Helper to convert Zod errors to Record<string, string>
function zodErrorToMap(error: any): ValidationErrors {
  const errors: ValidationErrors = {};
  error.issues.forEach((issue: any) => {
    const path = issue.path[issue.path.length - 1];
    if (typeof path === "string") {
      errors[path] = issue.message;
    }
  });
  return errors;
}

/**
 * @deprecated Use addressSchema directly
 */
export function validateRequiredFields(address: AddressEntry): ValidationErrors {
  const result = addressSchema.safeParse(address);
  if (!result.success) {
    return zodErrorToMap(result.error);
  }
  return {};
}

/**
 * @deprecated Use addressSchema directly
 */
export function validateDateRange(address: AddressEntry): string | null {
  const result = addressSchema.safeParse(address);
  if (!result.success) {
    // Find specific date range error
    const issue = result.error.issues.find(
      (i) => i.message === "Start date must be before end date"
    );
    if (issue) return issue.message;
  }
  return null;
}

/**
 * @deprecated Use addressSchema directly
 */
export function validateZipCode(
  zip: string | undefined,
  country: string
): string | null {
  // We construct a partial object to validate just the ZIP logic via schema.
  // This ensures single source of truth for validation rules.
  // We mock other required fields to pass basic schema validation.
  const mockAddress = {
    id: "temp",
    street: "temp",
    city: "temp",
    state: "temp",
    startMonth: "01",
    startYear: "2020",
    isCurrent: true,
    zip: zip || "",
    country: country || "",
  };

  const result = addressSchema.safeParse(mockAddress);
  if (!result.success) {
    const zipIssue = result.error.issues.find((i) => i.path.includes("zip"));
    if (zipIssue) return zipIssue.message;
  }
  return null;
}

function checkOverlap(addr1: AddressEntry, addr2: AddressEntry): boolean {
  if (
    !addr1.startMonth ||
    !addr1.startYear ||
    !addr2.startMonth ||
    !addr2.startYear
  ) {
    return false;
  }

  const start1 = monthYearToDate(
    addr1.startMonth,
    addr1.startYear,
    addr1.startDay
  );
  const end1 = addr1.isCurrent
    ? new Date()
    : addr1.endMonth && addr1.endYear
    ? monthYearToDate(addr1.endMonth, addr1.endYear, addr1.endDay)
    : start1;

  const start2 = monthYearToDate(
    addr2.startMonth,
    addr2.startYear,
    addr2.startDay
  );
  const end2 = addr2.isCurrent
    ? new Date()
    : addr2.endMonth && addr2.endYear
    ? monthYearToDate(addr2.endMonth, addr2.endYear, addr2.endDay)
    : start2;

  return start1 <= end2 && start2 <= end1;
}

export function validateAllAddresses(
  addresses: AddressEntry[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];

    // Field-level validation using Zod
    const result = addressSchema.safeParse(addr);
    if (!result.success) {
      errors[addr.id] = result.error.issues[0].message;
      continue;
    }

    // Cross-address validation (overlap)
    for (let j = i + 1; j < addresses.length; j++) {
      if (checkOverlap(addr, addresses[j])) {
        errors[addr.id] = "Address dates overlap with another address";
        break;
      }
    }
  }

  return errors;
}

export function validateAddress(
  address: AddressEntry,
  allAddresses: AddressEntry[]
): ValidationErrors {
  const result = addressSchema.safeParse(address);
  const errors: ValidationErrors = {};

  if (!result.success) {
    Object.assign(errors, zodErrorToMap(result.error));
  }

  const otherAddresses = allAddresses.filter((a) => a.id !== address.id);
  for (const other of otherAddresses) {
    if (checkOverlap(address, other)) {
      errors.overlap = "Address dates overlap with another address";
      break;
    }
  }

  return errors;
}
