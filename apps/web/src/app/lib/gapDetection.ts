import type { AddressEntry } from "./intakeStorage";
import { monthYearToDate, daysBetween } from "./dateUtils";

const SIGNIFICANT_GAP_DAYS = 30;

export function detectGap(
  newAddress: AddressEntry,
  previousAddress: AddressEntry
): number {
  if (
    !newAddress.startMonth ||
    !newAddress.startYear ||
    !previousAddress.endMonth ||
    !previousAddress.endYear
  ) {
    return 0;
  }

  const newStart = monthYearToDate(
    newAddress.startMonth,
    newAddress.startYear,
    newAddress.startDay
  );

  const prevEnd = monthYearToDate(
    previousAddress.endMonth,
    previousAddress.endYear,
    previousAddress.endDay
  );

  return daysBetween(prevEnd, newStart);
}

export function hasSignificantGap(
  newAddress: AddressEntry,
  previousAddress: AddressEntry
): boolean {
  const gap = detectGap(newAddress, previousAddress);
  return gap > SIGNIFICANT_GAP_DAYS;
}

export function findGaps(
  addresses: AddressEntry[]
): Array<{ afterAddressId: string; gapDays: number }> {
  const sorted = [...addresses]
    .filter((a) => a.startMonth && a.startYear)
    .sort((a, b) => {
      const aDate = monthYearToDate(a.startMonth, a.startYear, a.startDay);
      const bDate = monthYearToDate(b.startMonth, b.startYear, b.startDay);
      return bDate.getTime() - aDate.getTime();
    });

  const gaps: Array<{ afterAddressId: string; gapDays: number }> = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const older = sorted[i + 1];

    if (!current.endMonth || !current.endYear) continue;
    if (current.isCurrent) continue;

    const gapDays = detectGap(current, older);
    if (gapDays > SIGNIFICANT_GAP_DAYS) {
      gaps.push({ afterAddressId: older.id, gapDays });
    }
  }

  return gaps;
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

export function findOverlaps(
  addresses: AddressEntry[]
): Array<{ id1: string; id2: string }> {
  const overlaps: Array<{ id1: string; id2: string }> = [];

  for (let i = 0; i < addresses.length; i++) {
    for (let j = i + 1; j < addresses.length; j++) {
      if (checkOverlap(addresses[i], addresses[j])) {
        overlaps.push({ id1: addresses[i].id, id2: addresses[j].id });
      }
    }
  }
  return overlaps;
}
