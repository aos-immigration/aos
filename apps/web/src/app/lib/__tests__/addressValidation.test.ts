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
  it("returns empty object for valid addresses without overlap", () => {
    const addresses = [
      createAddress({ id: "1", isCurrent: true, startMonth: "01", startYear: "2020" }),
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

  it("catches overlap errors", () => {
    const addresses = [
      createAddress({
        id: "1",
        startMonth: "01",
        startYear: "2019",
        endMonth: "12",
        endYear: "2020",
        isCurrent: false,
      }),
      createAddress({
        id: "2",
        startMonth: "06",
        startYear: "2019",
        endMonth: "12",
        endYear: "2021",
        isCurrent: false,
      }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBeDefined();
  });
});
