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
