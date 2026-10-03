import type { IntakeAddress, IntakeEmployment, PersonRole } from "./schema";

export type HistoryBar = {
  id: string;
  label: string;
  left: number;
  width: number;
  gapBefore: boolean;
  overlap: boolean;
};

const WINDOW = 60;

function monthIndex(year: string, month: string): number | null {
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) return null;
  const monthNumber = Number(month);
  if (monthNumber < 1 || monthNumber > 12) return null;
  return Number(year) * 12 + (monthNumber - 1);
}

function asOfIndex(asOf: Date): number {
  return asOf.getFullYear() * 12 + asOf.getMonth();
}

type Raw = { id: string; label: string; start: number; end: number; explanation: string };

function place(rows: Raw[], asOf: Date): HistoryBar[] {
  const windowEnd = asOfIndex(asOf);
  const windowStart = windowEnd - WINDOW;
  const span = WINDOW || 1;
  const sorted = [...rows].sort((a, b) => a.start - b.start);
  return sorted.map((row, index) => {
    const previous = sorted[index - 1];
    const clippedStart = Math.max(row.start, windowStart);
    const clippedEnd = Math.min(row.end, windowEnd);
    const left = ((clippedStart - windowStart) / span) * 100;
    const width = Math.max(((clippedEnd - clippedStart + 1) / span) * 100, 1.5);
    const overlap = previous ? previous.end >= row.start : false;
    const gapBefore = previous
      ? row.start > previous.end + 1 && row.explanation === ""
      : row.start > windowStart && row.explanation === "";
    return {
      id: row.id,
      label: row.label,
      left: Math.min(Math.max(left, 0), 100),
      width: Math.min(width, 100),
      gapBefore,
      overlap,
    };
  });
}

export function addressBars(
  rows: readonly IntakeAddress[],
  role: PersonRole,
  asOf: Date,
): HistoryBar[] {
  const raw: Raw[] = [];
  for (const row of rows) {
    if (row.personRole !== role || row.kind !== "physical") continue;
    const start = monthIndex(row.startYear, row.startMonth);
    if (start === null) continue;
    const end = row.isCurrent ? asOfIndex(asOf) : monthIndex(row.endYear, row.endMonth);
    if (end === null || end < start) continue;
    raw.push({
      id: row.id,
      label: row.city || row.street || "Address",
      start,
      end,
      explanation: row.gapExplanation.trim(),
    });
  }
  return place(raw, asOf);
}

export function employmentBars(
  rows: readonly IntakeEmployment[],
  role: PersonRole,
  asOf: Date,
): HistoryBar[] {
  const raw: Raw[] = [];
  for (const row of rows) {
    if (row.personRole !== role) continue;
    const start = monthIndex(row.fromYear, row.fromMonth);
    if (start === null) continue;
    const end = row.isCurrent ? asOfIndex(asOf) : monthIndex(row.toYear, row.toMonth);
    if (end === null || end < start) continue;
    raw.push({
      id: row.id,
      label: row.employerName || row.status || "Work",
      start,
      end,
      explanation: row.gapExplanation.trim(),
    });
  }
  return place(raw, asOf);
}
