import type { AddressEntry } from "./intakeStorage";
import { compareDates, isDateInFuture, monthYearToDate } from "./dateUtils";

export type ValidationErrors = Record<string, string>;

export function validateRequiredFields(address: AddressEntry): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!address.street?.trim()) {
    errors.street = "Street address is required";
  }
  if (!address.city?.trim()) {
    errors.city = "City is required";
  }
  if (!address.state?.trim()) {
    errors.state = "State is required";
  }
  if (!address.zip?.trim()) {
    errors.zip = "ZIP code is required";
  }
  if (!address.country?.trim()) {
    errors.country = "Country is required";
  }
  if (!address.startMonth) {
    errors.startMonth = "Start month is required";
  }
  if (!address.startYear) {
    errors.startYear = "Start year is required";
  }

  return errors;
}

export function validateDateRange(address: AddressEntry): string | null {
  if (!address.startMonth || !address.startYear) {
    return null;
  }

  if (isDateInFuture(address.startMonth, address.startYear)) {
    return "Start date cannot be in the future";
  }

  if (!address.isCurrent && address.endMonth && address.endYear) {
    const cmp = compareDates(
      address.startMonth,
      address.startYear,
      address.endMonth,
      address.endYear
    );
    if (cmp > 0) {
      return "Start date must be before end date";
    }
  }

  return null;
}

export function validateZipCode(zip: string | undefined, country: string): string | null {
  if (!zip?.trim()) {
    return "ZIP code is required";
  }

  if (country === "United States" || country === "USA" || country === "US") {
    if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) {
      return "ZIP code must be 5 digits";
    }
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
    const required = validateRequiredFields(addr);
    if (Object.keys(required).length > 0) {
      errors[addr.id] = Object.values(required)[0];
      continue;
    }

    const dateError = validateDateRange(addr);
    if (dateError) {
      errors[addr.id] = dateError;
      continue;
    }

    const zipError = validateZipCode(addr.zip, addr.country);
    if (zipError) {
      errors[addr.id] = zipError;
      continue;
    }

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
  const errors: ValidationErrors = {};

  const required = validateRequiredFields(address);
  Object.assign(errors, required);

  const dateError = validateDateRange(address);
  if (dateError) {
    errors.dateRange = dateError;
  }

  const zipError = validateZipCode(address.zip, address.country);
  if (zipError) {
    errors.zip = zipError;
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
