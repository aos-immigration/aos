import { describe, it, expect } from "vitest";
import { detectGap, hasSignificantGap, findGaps } from "../gapDetection";
import type { AddressEntry } from "../intakeStorage";

const createAddress = (overrides: Partial<AddressEntry> = {}): AddressEntry => ({
  id: "test-id",
  street: "123 Main St",
  city: "New York",
  state: "NY",
  zip: "10001",
  country: "United States",
  startMonth: "01",
  startYear: "2020",
  isCurrent: false,
  ...overrides,
});

describe("detectGap", () => {
  it("detects gap between addresses", () => {
    const newer = createAddress({
      id: "new",
      startMonth: "03",
      startYear: "2020",
    });
    const older = createAddress({
      id: "old",
      endMonth: "01",
      endYear: "2020",
    });

    const gap = detectGap(newer, older);
    expect(gap).toBeGreaterThan(0);
  });

  it("returns 0 for adjacent months", () => {
    const newer = createAddress({
      id: "new",
      startMonth: "02",
      startYear: "2020",
    });
    const older = createAddress({
      id: "old",
      endMonth: "01",
      endYear: "2020",
    });

    const gap = detectGap(newer, older);
    expect(gap).toBeLessThanOrEqual(31);
  });

  it("handles missing dates gracefully", () => {
    const newer = createAddress({ id: "new", startMonth: "" });
    const older = createAddress({ id: "old", endMonth: "" });

    expect(() => detectGap(newer, older)).not.toThrow();
    expect(detectGap(newer, older)).toBe(0);
  });
});

describe("hasSignificantGap", () => {
  it("returns true for gaps > 30 days", () => {
    const newer = createAddress({
      id: "new",
      startMonth: "04",
      startYear: "2020",
    });
    const older = createAddress({
      id: "old",
      endMonth: "01",
      endYear: "2020",
    });

    expect(hasSignificantGap(newer, older)).toBe(true);
  });

  it("returns false for adjacent addresses (same month)", () => {
    const newer = createAddress({
      id: "new",
      startMonth: "01",
      startYear: "2020",
      startDay: "15",
    });
    const older = createAddress({
      id: "old",
      endMonth: "01",
      endYear: "2020",
      endDay: "14",
    });

    expect(hasSignificantGap(newer, older)).toBe(false);
  });
});

describe("findGaps", () => {
  it("finds all significant gaps", () => {
    const addresses = [
      createAddress({
        id: "1",
        startMonth: "06",
        startYear: "2022",
        isCurrent: true,
      }),
      createAddress({
        id: "2",
        startMonth: "01",
        startYear: "2021",
        endMonth: "03",
        endYear: "2022",
      }),
      createAddress({
        id: "3",
        startMonth: "01",
        startYear: "2020",
        endMonth: "06",
        endYear: "2020",
      }),
    ];

    const gaps = findGaps(addresses);
    expect(gaps.length).toBeGreaterThan(0);
  });

  it("returns empty array for no gaps", () => {
    const addresses = [
      createAddress({
        id: "1",
        startMonth: "02",
        startYear: "2020",
        isCurrent: true,
      }),
      createAddress({
        id: "2",
        startMonth: "01",
        startYear: "2020",
        endMonth: "01",
        endYear: "2020",
      }),
    ];

    const gaps = findGaps(addresses);
    expect(gaps).toHaveLength(0);
  });
});
