import { describe, it, expect } from "vitest";
import { addressSchema } from "../schemas/addressSchema";

describe("addressSchema", () => {
  const validUSAddress = {
    id: "123",
    street: "123 Main St",
    city: "San Jose",
    state: "CA",
    zip: "95112",
    country: "United States",
    startMonth: "01",
    startYear: "2020",
    isCurrent: true,
  };

  it("validates correct US zip code", () => {
    const result = addressSchema.safeParse(validUSAddress);
    expect(result.success).toBe(true);
  });

  it("rejects invalid US zip code", () => {
    const result = addressSchema.safeParse({
      ...validUSAddress,
      zip: "123", // Too short
    });
    expect(result.success).toBe(false);
    if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes("zip"))).toBe(true);
    }
  });

  it("accepts alphanumeric zip code for Canada", () => {
    const validCAAddress = {
      ...validUSAddress,
      country: "Canada",
      state: "ON", // Ontario
      zip: "M5V 3L9",
    };
    const result = addressSchema.safeParse(validCAAddress);
    expect(result.success).toBe(true);
  });

  it("accepts alphanumeric zip code for UK", () => {
    const validUKAddress = {
      ...validUSAddress,
      country: "United Kingdom",
      state: "London",
      zip: "SW1A 1AA",
    };
    const result = addressSchema.safeParse(validUKAddress);
    expect(result.success).toBe(true);
  });

  it("rejects empty zip code even for non-US", () => {
    const invalidAddress = {
      ...validUSAddress,
      country: "Canada",
      zip: "",
    };
    const result = addressSchema.safeParse(invalidAddress);
    expect(result.success).toBe(false);
  });

  it("validates US zip with 5+4 format", () => {
      const result = addressSchema.safeParse({
          ...validUSAddress,
          zip: "12345-6789"
      });
      expect(result.success).toBe(true);
  });
});
