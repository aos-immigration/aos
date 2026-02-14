import { describe, it, expect } from "vitest";
import { addressSchema } from "../schemas/addressSchema";

describe("addressSchema", () => {
  const validAddress = {
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

  it("validates a correct address", () => {
    const result = addressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it("fails if start date is in the future", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureYear = String(futureDate.getFullYear());

    const result = addressSchema.safeParse({
      ...validAddress,
      startYear: futureYear,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Start date cannot be in the future");
    }
  });

  it("validates ZIP code format for US addresses", () => {
    const result = addressSchema.safeParse({
      ...validAddress,
      country: "United States",
      zip: "123", // Invalid
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("ZIP code must be 5 digits");
    }
  });

  it("allows non-US ZIP formats for international addresses", () => {
    const result = addressSchema.safeParse({
      ...validAddress,
      country: "Canada",
      zip: "M5V 3L9", // Canadian format
    });
    expect(result.success).toBe(true);
  });

  it("requires ZIP code even for international addresses", () => {
    const result = addressSchema.safeParse({
      ...validAddress,
      country: "Canada",
      zip: "",
    });
    expect(result.success).toBe(false);
  });
});
