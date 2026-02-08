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
    const errors = validateAddress(address, [address]);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("returns error for missing required fields", () => {
    const address = createAddress({ street: "", city: "" });
    const errors = validateAddress(address, [address]);
    expect(errors.street).toBe("Street address is required");
    expect(errors.city).toBe("City is required");
  });

  describe("ZIP code validation", () => {
    it("accepts valid US zip codes", () => {
      const address = createAddress({ zip: "10001", country: "United States" });
      expect(validateAddress(address, [address]).zip).toBeUndefined();

      const address2 = createAddress({ zip: "12345-6789", country: "USA" });
      expect(validateAddress(address2, [address2]).zip).toBeUndefined();
    });

    it("rejects invalid US zip codes", () => {
      const address = createAddress({ zip: "123", country: "United States" });
      expect(validateAddress(address, [address]).zip).toBe("ZIP code must be 5 digits (or 5+4 format)");
    });

    it("accepts international zip codes", () => {
      const address = createAddress({ zip: "SW1A 1AA", country: "United Kingdom" });
      expect(validateAddress(address, [address]).zip).toBeUndefined();
    });
  });

  describe("Date range validation", () => {
    it("returns error when start date is after end date", () => {
      const address = createAddress({
        startMonth: "12",
        startYear: "2022",
        endMonth: "01",
        endYear: "2020",
        isCurrent: false,
      });
      const errors = validateAddress(address, [address]);
      expect(errors.startMonth).toBe("Start date must be before end date");
    });

    it("requires end date for previous addresses", () => {
        const address = createAddress({
            isCurrent: false,
            endMonth: undefined,
            endYear: undefined
        });
        const addr: AddressEntry = {
            ...address,
            endMonth: "" as any,
            endYear: ""
        };
        const errors = validateAddress(addr, [addr]);
        expect(errors.endMonth).toBe("End month is required for previous addresses");
        expect(errors.endYear).toBe("End year is required for previous addresses");
    });
  });

  describe("Overlap validation", () => {
    it("detects overlap between addresses", () => {
        const addr1 = createAddress({
            id: "1",
            startMonth: "01",
            startYear: "2020",
            endMonth: "12",
            endYear: "2020",
            isCurrent: false
        });
        const addr2 = createAddress({
            id: "2",
            startMonth: "06",
            startYear: "2020",
            isCurrent: true
        });

        const errors = validateAddress(addr2, [addr1, addr2]);
        expect(errors.overlap).toBe("Address dates overlap with another address");
    });
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
