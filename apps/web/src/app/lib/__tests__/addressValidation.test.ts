import { describe, it, expect } from "vitest";
import {
  validateAddress,
  validateAllAddresses,
} from "../addressValidation";
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
  isCurrent: true,
  ...overrides,
});

describe("validateAddress", () => {
  it("returns no errors for valid address", () => {
    const address = createAddress();
    const errors = validateAddress(address, []);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("returns error for missing street", () => {
    const address = createAddress({ street: "" });
    const errors = validateAddress(address, []);
    expect(errors.street).toBe("Street address is required");
  });

  it("returns error for missing city", () => {
    const address = createAddress({ city: "" });
    const errors = validateAddress(address, []);
    expect(errors.city).toBe("City is required");
  });

  it("validates US zip codes", () => {
    const valid = createAddress({ zip: "10001", country: "United States" });
    expect(validateAddress(valid, []).zip).toBeUndefined();

    const invalid = createAddress({ zip: "123", country: "United States" });
    expect(validateAddress(invalid, []).zip).toBe("ZIP code must be 5 digits (or 5+4 format)");
  });

  it("is flexible for international zip codes", () => {
    const uk = createAddress({ zip: "SW1A 1AA", country: "United Kingdom" });
    expect(validateAddress(uk, []).zip).toBeUndefined();
  });

  it("validates date range for previous address", () => {
    const valid = createAddress({
      startMonth: "01",
      startYear: "2020",
      endMonth: "12",
      endYear: "2022",
      isCurrent: false,
    });
    expect(validateAddress(valid, []).dateRange).toBeUndefined();

    const invalid = createAddress({
      startMonth: "12",
      startYear: "2022",
      endMonth: "01",
      endYear: "2020",
      isCurrent: false,
    });
    // Zod refinement path might be 'startMonth' or similar, causing the error key to be 'startMonth'
    // or maybe 'dateRange' if I mapped it manually?
    // In validateAddress implementation:
    // result.error.issues.forEach((issue) => { const key = issue.path[0] ... })
    // The schema refinement sets path: ["startMonth"].
    // So error key will be "startMonth".
    // But the message is "Start date must be before end date".
    const errors = validateAddress(invalid, []);
    expect(errors.startMonth).toBe("Start date must be before end date");
  });

  it("requires end date for previous address", () => {
    const missingEnd = createAddress({
      startMonth: "01",
      startYear: "2020",
      endMonth: "", // Missing
      endYear: "",  // Missing
      isCurrent: false,
    });
    const errors = validateAddress(missingEnd, []);
    expect(errors.endMonth).toBeDefined();
    expect(errors.endYear).toBeDefined();
  });
});

describe("validateAllAddresses", () => {
  it("returns empty object for valid addresses", () => {
    const addresses = [
      createAddress({ id: "1", isCurrent: true }),
      createAddress({
        id: "2",
        startMonth: "01",
        startYear: "2018",
        endMonth: "12",
        endYear: "2019",
        isCurrent: false,
      }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("catches validation errors in multiple addresses", () => {
    const addresses = [
      createAddress({ id: "1", street: "" }),
      createAddress({ id: "2", zip: "" }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBeDefined();
    expect(errors["2"]).toBeDefined();
  });

  it("detects overlaps", () => {
    const addresses = [
      createAddress({
        id: "1",
        startMonth: "01",
        startYear: "2020",
        isCurrent: true, // 2020-01 to Present
      }),
      createAddress({
        id: "2",
        startMonth: "06",
        startYear: "2020",
        endMonth: "12",
        endYear: "2020",
        isCurrent: false, // 2020-06 to 2020-12
      }),
    ];
    // Address 2 is completely inside Address 1 time range.
    // Address 1 starts before Address 2 starts.
    // Overlap!
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBe("Address dates overlap with another address");
  });
});
