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

  it("catches validation errors in multiple addresses", () => {
    const addresses = [
      createAddress({ id: "1", street: "" }),
      createAddress({ id: "2", zip: "" }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBeDefined();
    expect(errors["2"]).toBeDefined();
  });

  it("detects overlapping dates", () => {
    const addresses = [
      createAddress({
        id: "1",
        startMonth: "01",
        startYear: "2020",
        isCurrent: true,
      }),
      createAddress({
        id: "2",
        startMonth: "06",
        startYear: "2020",
        endMonth: "12",
        endYear: "2020",
        isCurrent: false,
      }),
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBe("Address dates overlap with another address");
  });

  it("validates conditional zip code correctly", () => {
    // US address with invalid zip
    const usAddress = createAddress({
      id: "us",
      country: "United States",
      zip: "123"
    });

    // UK address with "invalid" US zip format (should be valid)
    const ukAddress = createAddress({
      id: "uk",
      country: "United Kingdom",
      zip: "SW1A 1AA",
      // Avoid overlap with usAddress
      startYear: "2010",
      endYear: "2011",
      isCurrent: false
    });

    const errors = validateAllAddresses([usAddress, ukAddress]);
    expect(errors["us"]).toBeDefined(); // Should fail
    expect(errors["uk"]).toBeUndefined(); // Should pass
  });

  it("validates future dates", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const address = createAddress({
      id: "future",
      startYear: futureDate.getFullYear().toString(),
      startMonth: "01"
    });

    const errors = validateAllAddresses([address]);
    expect(errors["future"]).toBe("Start date cannot be in the future");
  });
});
