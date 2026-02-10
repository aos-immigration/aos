import type { AddressEntry } from "./intakeStorage";
import { monthYearToDate } from "./dateUtils";
import { addressSchema } from "./schemas/addressSchema";

export type ValidationErrors = Record<string, string>;

function checkOverlap(addr1: AddressEntry, addr2: AddressEntry): boolean {
  if (
    !addr1.startMonth ||
    !addr1.startYear ||
    !addr2.startMonth ||
    !addr2.startYear
  ) {
    return false;
  }

  const start1 = monthYearToDate(addr1.startMonth, addr1.startYear, addr1.startDay);
  const end1 = addr1.isCurrent
    ? new Date()
    : addr1.endMonth && addr1.endYear
      ? monthYearToDate(addr1.endMonth, addr1.endYear, addr1.endDay)
      : start1;

  const start2 = monthYearToDate(addr2.startMonth, addr2.startYear, addr2.startDay);
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

    // Field validation using Zod schema
    const result = addressSchema.safeParse(addr);
    if (!result.success) {
      // Return the first error message
      errors[addr.id] = result.error.issues[0].message;
      continue;
    }

    // Overlap validation
    for (let j = i + 1; j < addresses.length; j++) {
      if (checkOverlap(addr, addresses[j])) {
        errors[addr.id] = "Address dates overlap with another address";
        break;
      }
    }
  }

  return errors;
}
