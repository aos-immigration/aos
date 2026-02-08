import type { MonthValue } from "./intakeStorage";

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Aug",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Dec",
};

export function formatDateRange(
  startMonth: string,
  startYear: string,
  endMonth?: string,
  endYear?: string
): string {
  const start =
    startMonth && startYear
      ? `${MONTH_LABELS[startMonth] ?? startMonth} ${startYear}`
      : "";
  const end =
    endMonth && endYear
      ? `${MONTH_LABELS[endMonth] ?? endMonth} ${endYear}`
      : "Present";

  if (!start) return "";
  return `${start} - ${end}`;
}

export function getYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = 0; i < 12; i++) {
    years.push(String(currentYear - i));
  }
  return years;
}

export function getMonthOptions(): Array<{ value: MonthValue; label: string }> {
  return [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];
}

export function monthYearToDate(month: string, year: string, day?: string): Date {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10) - 1;
  const d = day ? parseInt(day, 10) : 1;
  return new Date(y, m, d);
}

export function daysBetween(date1: Date, date2: Date): number {
  const ms = date2.getTime() - date1.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
