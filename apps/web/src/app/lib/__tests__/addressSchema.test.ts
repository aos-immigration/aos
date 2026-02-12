import { describe, it, expect } from "vitest";
import { addressSchema, previousAddressSchema } from "../schemas/addressSchema";

const validAddress = {
  id: "test",
  street: "123 Main St",
  city: "San Jose",
  state: "CA",
  zip: "95112",
  country: "United States",
  startMonth: "01",
  startYear: "2020",
  isCurrent: true,
};

describe("addressSchema", () => {
  it("validates a correct US address", () => {
    const result = addressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it("fails on missing required fields", () => {
    const invalid = { ...validAddress, street: "" };
    const result = addressSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Street address is required");
    }
  });

  describe("ZIP code validation", () => {
    it("validates 5-digit US zip", () => {
      const result = addressSchema.safeParse({ ...validAddress, zip: "12345" });
      expect(result.success).toBe(true);
    });

    it("validates 5+4 US zip", () => {
      const result = addressSchema.safeParse({ ...validAddress, zip: "12345-6789" });
      expect(result.success).toBe(true);
    });

    it("fails invalid US zip", () => {
      const result = addressSchema.safeParse({ ...validAddress, zip: "1234" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("ZIP code must be 5 digits");
      }
    });

    it("allows non-US zip format", () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        country: "Canada",
        zip: "M5V 2T6",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Future date validation", () => {
    it("fails if start date is in the future", () => {
      const futureYear = (new Date().getFullYear() + 1).toString();
      const result = addressSchema.safeParse({
        ...validAddress,
        startYear: futureYear,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Start date cannot be in the future");
      }
    });
  });

  describe("Date range validation", () => {
    it("fails if start date is after end date", () => {
      const result = addressSchema.safeParse({
        ...validAddress,
        isCurrent: false,
        startYear: "2022",
        endYear: "2020",
        endMonth: "01",
      });
      expect(result.success).toBe(false);
       if (!result.success) {
        expect(result.error.issues[0].message).toContain("Start date must be before end date");
      }
    });
  });
});

describe("previousAddressSchema", () => {
  it("requires end date", () => {
    const result = previousAddressSchema.safeParse({
      ...validAddress,
      isCurrent: false,
      endMonth: "",
      endYear: "",
    });
    expect(result.success).toBe(false);
  });
});
