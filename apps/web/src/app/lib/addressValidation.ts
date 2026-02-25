import { z } from "zod";
import type { AddressEntry } from "./intakeStorage";
import { addressSchema } from "./schemas/addressSchema";
import { monthYearToDate } from "./dateUtils";

export function validateAllAddresses(
  addresses: AddressEntry[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];

    // Schema validation
    const result = addressSchema.safeParse(addr);
    if (!result.success) {
      // Return the first error message
      // Zod v4 uses issues, v3 uses errors
      const issues = result.error.issues || (result.error as any).errors;
      if (issues && issues.length > 0) {
        errors[addr.id] = issues[0].message;
      }
      continue;
    }

    // Overlap check
    for (let j = i + 1; j < addresses.length; j++) {
      if (checkOverlap(addr, addresses[j])) {
        errors[addr.id] = "Address dates overlap with another address";
        break;
      }
    }
  }

  return errors;
}

export function checkOverlap(addr1: AddressEntry, addr2: AddressEntry): boolean {
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
    ? new Date() // Now
    : addr1.endMonth && addr1.endYear
      ? monthYearToDate(addr1.endMonth, addr1.endYear, addr1.endDay)
      : start1; // If no end date and not current, assume single point in time? Or invalid?
      // Schema ensures end date exists if not current (via previousAddressSchema refinement),
      // but addressSchema itself only checks start <= end if end exists.
      // If end doesn't exist and not current, it's effectively a point in time or invalid.
      // Let's assume point in time for overlap check to be safe.

  const start2 = monthYearToDate(addr2.startMonth, addr2.startYear, addr2.startDay);
  const end2 = addr2.isCurrent
    ? new Date()
    : addr2.endMonth && addr2.endYear
      ? monthYearToDate(addr2.endMonth, addr2.endYear, addr2.endDay)
      : start2;

  // Simple overlap check: (StartA <= EndB) and (EndA >= StartB)
  return start1 <= end2 && end1 >= start2;
}
