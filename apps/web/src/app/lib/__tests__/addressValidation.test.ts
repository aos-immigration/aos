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
  it("returns no errors for valid address", () => {
    const addresses = [createAddress()];
    const errors = validateAllAddresses(addresses);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("returns error for missing street", () => {
    const addresses = [createAddress({ id: "1", street: "" })];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBe("Street address is required");
  });

  it("returns error for missing city", () => {
    const addresses = [createAddress({ id: "1", city: "" })];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBe("City is required");
  });

  it("validates ZIP code for US addresses", () => {
    const addresses = [createAddress({ id: "1", zip: "123", country: "United States" })];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBe("ZIP code must be 5 digits (or 5+4 format)");
  });

  it("allows non-US ZIP formats for other countries", () => {
    const addresses = [
      createAddress({ id: "1", zip: "SW1A 1AA", country: "United Kingdom" }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBeUndefined();
  });

  it("validates start date before end date", () => {
    const addresses = [
      createAddress({
        id: "1",
        startMonth: "12",
        startYear: "2022",
        endMonth: "01",
        endYear: "2022",
        isCurrent: false,
      }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBe("Start date must be before end date");
  });

  it("validates future dates", () => {
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

  it("detects overlap between addresses", () => {
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
        startYear: "2020", // Overlaps with address 1
        endMonth: "12",
        endYear: "2021",
        isCurrent: false,
      }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBe("Address dates overlap with another address");
  });

  it("detects overlap with current address", () => {
    const addresses = [
      createAddress({
        id: "1",
        startMonth: "01",
        startYear: "2020",
        isCurrent: true, // Ongoing since 2020
      }),
      createAddress({
        id: "2",
        startMonth: "01",
        startYear: "2021", // Starts inside current address range
        endMonth: "12",
        endYear: "2021",
        isCurrent: false,
      }),
    ];
     const errors = validateAllAddresses(addresses);
     expect(errors["1"]).toBe("Address dates overlap with another address");
  });
});
