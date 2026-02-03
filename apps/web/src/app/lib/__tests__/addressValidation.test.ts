import { describe, it, expect } from "vitest";
import {
  validateRequiredFields,
  validateDateRange,
  validateZipCode,
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

describe("validateRequiredFields", () => {
  it("returns no errors for valid address", () => {
    const address = createAddress();
    const errors = validateRequiredFields(address);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("returns error for missing street", () => {
    const address = createAddress({ street: "" });
    const errors = validateRequiredFields(address);
    expect(errors.street).toBe("Street address is required");
  });

  it("returns error for missing city", () => {
    const address = createAddress({ city: "" });
    const errors = validateRequiredFields(address);
    expect(errors.city).toBe("City is required");
  });

  it("handles undefined fields without throwing", () => {
    const address = {
      id: "test",
      isCurrent: true,
    } as AddressEntry;

    expect(() => validateRequiredFields(address)).not.toThrow();
    const errors = validateRequiredFields(address);
    expect(errors.street).toBeDefined();
    expect(errors.zip).toBeDefined();
  });

  it("handles null-ish values", () => {
    const address = createAddress({
      street: undefined as unknown as string,
      zip: undefined as unknown as string,
    });
    expect(() => validateRequiredFields(address)).not.toThrow();
  });
});

describe("validateZipCode", () => {
  it("accepts valid US zip codes", () => {
    expect(validateZipCode("10001", "United States")).toBeNull();
    expect(validateZipCode("90210", "USA")).toBeNull();
    expect(validateZipCode("12345-6789", "US")).toBeNull();
  });

  it("rejects invalid US zip codes", () => {
    expect(validateZipCode("123", "United States")).toBe("ZIP code must be 5 digits");
    expect(validateZipCode("abcde", "United States")).toBe("ZIP code must be 5 digits");
  });

  it("is flexible for international zip codes", () => {
    expect(validateZipCode("SW1A 1AA", "United Kingdom")).toBeNull();
    expect(validateZipCode("M5V 3L9", "Canada")).toBeNull();
  });

  it("handles undefined zip", () => {
    expect(() => validateZipCode(undefined, "United States")).not.toThrow();
    expect(validateZipCode(undefined, "United States")).toBe("ZIP code is required");
  });
});

describe("validateDateRange", () => {
  it("returns null for valid date range", () => {
    const address = createAddress({
      startMonth: "01",
      startYear: "2020",
      endMonth: "12",
      endYear: "2022",
      isCurrent: false,
    });
    expect(validateDateRange(address)).toBeNull();
  });

  it("returns error when start date is after end date", () => {
    const address = createAddress({
      startMonth: "12",
      startYear: "2022",
      endMonth: "01",
      endYear: "2020",
      isCurrent: false,
    });
    expect(validateDateRange(address)).toBe("Start date must be before end date");
  });

  it("allows missing end date for current address", () => {
    const address = createAddress({
      startMonth: "01",
      startYear: "2020",
      isCurrent: true,
    });
    expect(validateDateRange(address)).toBeNull();
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
});
