import type { AddressEntry } from "./intakeStorage";
import { monthYearToDate } from "./dateUtils";
import { addressSchema } from "@/app/lib/schemas/addressSchema";
import { ZodError } from "zod";

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

    // Validate individual address using Zod schema
    const result = addressSchema.safeParse(addr);

    if (!result.success) {
      const error = result.error;
      let message = "Validation error";

      // Accessing internals safely.
      // TS might complain about 'errors' property depending on Zod version/types, so we cast to any.
      const zodErrors = (error as any).errors || (error as any).issues;

      if (zodErrors && zodErrors.length > 0) {
        message = zodErrors[0].message;
      } else {
           // Fallback: parse message string if issues/errors are missing
           try {
              const parsed = JSON.parse(error.message);
              if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0] as any).message) {
                  message = (parsed[0] as any).message;
              } else {
                  message = error.message;
              }
          } catch (e) {
              message = error.message;
          }
      }

      errors[addr.id] = message;
      continue;
    }

    // Check for overlaps
    for (let j = i + 1; j < addresses.length; j++) {
      if (checkOverlap(addr, addresses[j])) {
        errors[addr.id] = "Address dates overlap with another address";
        break;
      }
    }
  }

  return errors;
}
