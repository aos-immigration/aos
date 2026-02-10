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

  it("catches required field errors", () => {
    const addresses = [
      createAddress({ id: "1", street: "" }),
      createAddress({ id: "2", city: "" }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toContain("Street address is required");
    expect(errors["2"]).toContain("City is required");
  });

  it("catches zip code errors for US", () => {
    const addresses = [
      createAddress({ id: "1", zip: "123", country: "United States" }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toContain("ZIP code must be 5 digits");
  });

  it("allows international zip codes", () => {
    const addresses = [
      createAddress({ id: "1", zip: "SW1A 1AA", country: "United Kingdom" }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBeUndefined();
  });

  it("catches date range errors", () => {
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
    expect(errors["1"]).toContain("Start date must be before end date");
  });

  it("catches future start date errors", () => {
    const futureYear = String(new Date().getFullYear() + 2);
    const addresses = [
      createAddress({
        id: "1",
        startMonth: "01",
        startYear: futureYear,
        isCurrent: true,
      }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toContain("Start date cannot be in the future");
  });

  it("catches overlap errors", () => {
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
        startYear: "2020",
        endMonth: "06",
        endYear: "2021",
        isCurrent: false,
      }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toContain("Address dates overlap");
  });
});
