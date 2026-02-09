import { describe, it, expect } from "vitest";
import { addressSchema } from "../schemas/addressSchema";

describe("addressSchema", () => {
  it("validates US zip codes correctly", () => {
    const validUS = {
      id: "1",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "United States",
      startMonth: "01",
      startYear: "2020",
      isCurrent: true,
    };
    expect(addressSchema.safeParse(validUS).success).toBe(true);

    const validUSLong = { ...validUS, zip: "10001-1234" };
    expect(addressSchema.safeParse(validUSLong).success).toBe(true);

    const invalidUS = { ...validUS, zip: "123" };
    const result = addressSchema.safeParse(invalidUS);
    expect(result.success).toBe(false);
    if (!result.success) {
      // We expect the error to be on the zip field
      const zipError = result.error.issues.find((i) => i.path.includes("zip"));
      expect(zipError).toBeDefined();
      expect(zipError?.message).toContain("ZIP code must be 5 digits");
    }
  });

  it("allows non-US zip codes to be flexible", () => {
    const validUK = {
      id: "2",
      street: "10 Downing St",
      city: "London",
      state: "London",
      zip: "SW1A 2AA",
      country: "United Kingdom",
      startMonth: "01",
      startYear: "2020",
      isCurrent: true,
    };
    expect(addressSchema.safeParse(validUK).success).toBe(true);

    const validCanada = { ...validUK, country: "Canada", zip: "M5V 3L9" };
    expect(addressSchema.safeParse(validCanada).success).toBe(true);
  });

  it("validates date range", () => {
    const validRange = {
      id: "3",
      street: "123 Main St",
      city: "City",
      state: "State",
      zip: "12345",
      country: "United States",
      startMonth: "01",
      startYear: "2020",
      endMonth: "01",
      endYear: "2021",
      isCurrent: false,
    };
    expect(addressSchema.safeParse(validRange).success).toBe(true);

    const invalidRange = {
      ...validRange,
      startYear: "2022",
      endYear: "2020",
    };
    const result = addressSchema.safeParse(invalidRange);
    expect(result.success).toBe(false);
    if (!result.success) {
      const dateError = result.error.issues.find((i) => i.path.includes("startMonth"));
      expect(dateError).toBeDefined();
      expect(dateError?.message).toBe("Start date must be before end date");
    }
  });
});
