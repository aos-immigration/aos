import { describe, it, expect } from "vitest";
import { validateAllAddresses } from "../addressValidation";
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

  it("catches validation errors (missing fields)", () => {
    const addresses = [
      createAddress({ id: "1", street: "" }),
      createAddress({ id: "2", zip: "" }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBe("Street address is required");
    expect(errors["2"]).toBe("ZIP code is required");
  });

  it("catches invalid zip codes", () => {
    const addresses = [
      createAddress({ id: "1", zip: "123" }), // Invalid US zip
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBe("ZIP code must be 5 digits (or 5+4 format)");
  });

  it("catches invalid date range (start after end)", () => {
    const addresses = [
      createAddress({
        id: "1",
        startMonth: "12",
        startYear: "2022",
        endMonth: "01",
        endYear: "2020",
        isCurrent: false,
      }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBe("Start date must be before end date");
  });

  it("catches future start date", () => {
    const futureYear = String(new Date().getFullYear() + 1);
    const addresses = [
      createAddress({
        id: "1",
        startMonth: "01",
        startYear: futureYear,
        isCurrent: true,
      }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBe("Start date cannot be in the future");
  });

  it("catches overlaps", () => {
    const addresses = [
      createAddress({
        id: "1",
        startMonth: "01",
        startYear: "2020",
        endMonth: "12",
        endYear: "2020",
        isCurrent: false,
      }),
      createAddress({
        id: "2",
        startMonth: "06",
        startYear: "2020", // Overlaps with 1
        endMonth: "12",
        endYear: "2021",
        isCurrent: false,
      }),
    ];
    const errors = validateAllAddresses(addresses);

    // Logic: for loop i=0 ("1"). j=1 ("2"). checkOverlap(1,2) is true.
    // errors["1"] = "Address dates overlap..."
    // break.
    // loop i=1 ("2"). j loop doesn't run.
    expect(errors["1"]).toBe("Address dates overlap with another address");
  });
});
