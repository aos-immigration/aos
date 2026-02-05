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
      createAddress({ id: "1", street: "" }), // Missing street
      createAddress({ id: "2", zip: "" }), // Missing zip
    ];
    const errors = validateAllAddresses(addresses);
    expect(errors["1"]).toBeDefined();
    expect(errors["2"]).toBeDefined();
  });

  it("validates zip code format for US", () => {
    const address = createAddress({ id: "1", zip: "123" }); // Invalid US zip
    const errors = validateAllAddresses([address]);
    expect(errors["1"]).toContain("ZIP code");
  });

  it("allows non-standard zip for international addresses", () => {
    const address = createAddress({
      id: "1",
      country: "United Kingdom",
      zip: "SW1A 1AA",
    });
    const errors = validateAllAddresses([address]);
    expect(errors["1"]).toBeUndefined();
  });

  it("detects overlaps", () => {
    const addr1 = createAddress({
      id: "1",
      startMonth: "01",
      startYear: "2020",
      isCurrent: true,
    });
    const addr2 = createAddress({
      id: "2",
      startMonth: "06",
      startYear: "2020", // Starts inside addr1 range
      endMonth: "12",
      endYear: "2020",
      isCurrent: false,
    });
    const errors = validateAllAddresses([addr1, addr2]);
    // The overlap logic might flag the earlier address or later address depending on loop order.
    // The implementation iterates i, then j=i+1. If overlap(i, j), it flags i.
    expect(errors["1"]).toBe("Address dates overlap with another address");
  });
});
