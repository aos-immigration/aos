import { describe, it, expect } from "vitest";
import {
  formatDateRange,
  compareDates,
  isDateInFuture,
  getYearOptions,
  getMonthOptions,
  monthYearToDate,
  daysBetween,
} from "../dateUtils";

describe("formatDateRange", () => {
  it("formats date range with start and end", () => {
    expect(formatDateRange("01", "2020", "12", "2022")).toBe("Jan 2020 - Dec 2022");
  });

  it("shows Present when no end date", () => {
    expect(formatDateRange("01", "2020")).toBe("Jan 2020 - Present");
    expect(formatDateRange("06", "2021", "", "")).toBe("Jun 2021 - Present");
  });

  it("returns empty string when no start date", () => {
    expect(formatDateRange("", "")).toBe("");
    expect(formatDateRange("", "2020")).toBe("");
  });
});

describe("compareDates", () => {
  it("returns negative when first date is earlier", () => {
    expect(compareDates("01", "2020", "12", "2022")).toBeLessThan(0);
  });

  it("returns positive when first date is later", () => {
    expect(compareDates("12", "2022", "01", "2020")).toBeGreaterThan(0);
  });

  it("returns 0 for same dates", () => {
    expect(compareDates("06", "2021", "06", "2021")).toBe(0);
  });

  it("compares by year first", () => {
    expect(compareDates("12", "2019", "01", "2020")).toBeLessThan(0);
  });
});

describe("isDateInFuture", () => {
  it("returns true for future dates", () => {
    const futureYear = String(new Date().getFullYear() + 1);
    expect(isDateInFuture("01", futureYear)).toBe(true);
  });

  it("returns false for past dates", () => {
    expect(isDateInFuture("01", "2020")).toBe(false);
  });
});

describe("getYearOptions", () => {
  it("returns 12 years", () => {
    const years = getYearOptions();
    expect(years).toHaveLength(12);
  });

  it("starts with current year", () => {
    const years = getYearOptions();
    const currentYear = new Date().getFullYear();
    expect(years[0]).toBe(String(currentYear));
  });
});

describe("getMonthOptions", () => {
  it("returns 12 months", () => {
    const months = getMonthOptions();
    expect(months).toHaveLength(12);
  });

  it("has correct format", () => {
    const months = getMonthOptions();
    expect(months[0]).toEqual({ value: "01", label: "January" });
    expect(months[11]).toEqual({ value: "12", label: "December" });
  });
});

describe("monthYearToDate", () => {
  it("creates correct date", () => {
    const date = monthYearToDate("06", "2021");
    expect(date.getFullYear()).toBe(2021);
    expect(date.getMonth()).toBe(5); // 0-indexed
    expect(date.getDate()).toBe(1);
  });

  it("respects day parameter", () => {
    const date = monthYearToDate("06", "2021", "15");
    expect(date.getDate()).toBe(15);
  });
});

describe("daysBetween", () => {
  it("calculates positive days correctly", () => {
    const date1 = new Date(2020, 0, 1);
    const date2 = new Date(2020, 0, 31);
    expect(daysBetween(date1, date2)).toBe(30);
  });

  it("returns negative for reversed dates", () => {
    const date1 = new Date(2020, 0, 31);
    const date2 = new Date(2020, 0, 1);
    expect(daysBetween(date1, date2)).toBe(-30);
  });
});
