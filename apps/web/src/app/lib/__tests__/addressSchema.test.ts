import { describe, it, expect } from "vitest";
import type { z } from "zod";
import {
  addressSchema,
  currentAddressSchema,
  previousAddressSchema,
  type AddressFormData,
} from "../schemas/addressSchema";

const createAddress = (overrides: Partial<AddressFormData> = {}): AddressFormData => ({
  id: "addr-1",
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

const pastAddress = (overrides: Partial<AddressFormData> = {}) =>
  createAddress({ isCurrent: false, endMonth: "12", endYear: "2022", ...overrides });

const issuesFor = (result: z.ZodSafeParseResult<unknown>) =>
  result.success ? [] : result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));

const messageAt = (result: z.ZodSafeParseResult<unknown>, path: string) =>
  issuesFor(result).find((i) => i.path === path)?.message;

describe("addressSchema", () => {
  it("accepts a minimal current address", () => {
    expect(addressSchema.safeParse(createAddress()).success).toBe(true);
  });

  it("accepts all optional fields", () => {
    const result = addressSchema.safeParse(
      pastAddress({
        unit: "4B",
        startDay: "15",
        endDay: "20",
        gapExplanation: "Travelling",
        notes: "Sublet",
      })
    );
    expect(result.success).toBe(true);
  });

  it.each([
    ["street", "Street address is required"],
    ["city", "City is required"],
    ["state", "State is required"],
    ["zip", "ZIP code is required"],
    ["country", "Country is required"],
    ["startMonth", "Start month is required"],
    ["startYear", "Start year is required"],
  ] as const)("requires %s", (field, message) => {
    const result = addressSchema.safeParse(createAddress({ [field]: "" }));
    expect(result.success).toBe(false);
    expect(messageAt(result, field)).toBe(message);
  });

  it("rejects missing required keys and wrong types", () => {
    const result = addressSchema.safeParse({ id: "x", isCurrent: "yes" });
    expect(result.success).toBe(false);
    const paths = issuesFor(result).map((i) => i.path);
    expect(paths).toEqual(
      expect.arrayContaining(["street", "city", "state", "zip", "country", "startMonth", "startYear", "isCurrent"])
    );
  });

  it("requires an id", () => {
    const result = addressSchema.safeParse({ ...createAddress(), id: undefined });
    expect(issuesFor(result).map((i) => i.path)).toEqual(["id"]);
  });

  describe("zip", () => {
    it.each(["10001", "00501", "12345-6789"])("accepts %s", (zip) => {
      expect(addressSchema.safeParse(createAddress({ zip })).success).toBe(true);
    });

    it.each(["1234", "123456", "abcde", "12345-678", "12345 6789", "12345-67890", " 10001", "10001 "])(
      "rejects %j",
      (zip) => {
        const result = addressSchema.safeParse(createAddress({ zip }));
        expect(messageAt(result, "zip")).toBe("ZIP code must be 5 digits (or 5+4 format)");
      }
    );

    it("reports both required and format errors for an empty zip", () => {
      const result = addressSchema.safeParse(createAddress({ zip: "" }));
      expect(issuesFor(result).filter((i) => i.path === "zip").map((i) => i.message)).toEqual([
        "ZIP code is required",
        "ZIP code must be 5 digits (or 5+4 format)",
      ]);
    });
  });

  describe("date range refinement", () => {
    it("accepts start before end", () => {
      expect(addressSchema.safeParse(pastAddress()).success).toBe(true);
    });

    it("accepts start equal to end (same month and year)", () => {
      const result = addressSchema.safeParse(
        pastAddress({ startMonth: "06", startYear: "2021", endMonth: "06", endYear: "2021" })
      );
      expect(result.success).toBe(true);
    });

    it("rejects start after end and reports it on startMonth", () => {
      const result = addressSchema.safeParse(
        pastAddress({ startMonth: "07", startYear: "2021", endMonth: "06", endYear: "2021" })
      );
      expect(result.success).toBe(false);
      expect(messageAt(result, "startMonth")).toBe("Start date must be before end date");
    });

    it("compares years before months", () => {
      const result = addressSchema.safeParse(
        pastAddress({ startMonth: "12", startYear: "2019", endMonth: "01", endYear: "2020" })
      );
      expect(result.success).toBe(true);
    });

    it("skips the comparison for a current address", () => {
      const result = addressSchema.safeParse(
        createAddress({ isCurrent: true, startYear: "2022", endMonth: "01", endYear: "2020" })
      );
      expect(result.success).toBe(true);
    });

    it("skips the comparison when the end date is incomplete", () => {
      expect(addressSchema.safeParse(pastAddress({ endMonth: undefined })).success).toBe(true);
      expect(addressSchema.safeParse(pastAddress({ endYear: "" })).success).toBe(true);
    });

    it("ignores day fields in the comparison", () => {
      const result = addressSchema.safeParse(
        pastAddress({
          startMonth: "06",
          startYear: "2021",
          startDay: "30",
          endMonth: "06",
          endYear: "2021",
          endDay: "01",
        })
      );
      expect(result.success).toBe(true);
    });

    it("fails the range check when a year is not numeric", () => {
      const result = addressSchema.safeParse(pastAddress({ startYear: "abcd" }));
      expect(messageAt(result, "startMonth")).toBe("Start date must be before end date");
    });

    it("still runs alongside field-level errors", () => {
      const result = addressSchema.safeParse(
        pastAddress({ street: "", startYear: "2023", endYear: "2022" })
      );
      expect(issuesFor(result).map((i) => i.path)).toEqual(["street", "startMonth"]);
    });
  });

  // These assert the intended behavior and currently fail; see the PR description.
  describe("known gaps", () => {
    it.fails("accepts non-US postal codes for non-US countries", () => {
      const result = addressSchema.safeParse(createAddress({ country: "United Kingdom", zip: "SW1A 1AA" }));
      expect(result.success).toBe(true);
    });

    it.fails("rejects an out-of-range month", () => {
      const result = addressSchema.safeParse(
        pastAddress({ startMonth: "13", startYear: "2020", endMonth: "01", endYear: "2021" })
      );
      expect(result.success).toBe(false);
    });

    it.fails("rejects whitespace-only required fields", () => {
      expect(addressSchema.safeParse(createAddress({ street: "   " })).success).toBe(false);
    });
  });
});

describe("currentAddressSchema", () => {
  it("is the base address schema", () => {
    expect(currentAddressSchema).toBe(addressSchema);
  });
});

describe("previousAddressSchema", () => {
  it("accepts a complete past address", () => {
    expect(previousAddressSchema.safeParse(pastAddress()).success).toBe(true);
  });

  it("requires endMonth and endYear", () => {
    const result = previousAddressSchema.safeParse(createAddress({ isCurrent: false }));
    expect(messageAt(result, "endMonth")).toBe("End month is required for previous addresses");
    expect(messageAt(result, "endYear")).toBe("End year is required for previous addresses");
  });

  it("treats empty strings as missing end dates", () => {
    const result = previousAddressSchema.safeParse(pastAddress({ endMonth: "", endYear: "" }));
    expect(issuesFor(result).map((i) => i.path)).toEqual(["endMonth", "endYear"]);
  });

  it("requires end dates even when isCurrent is true", () => {
    const result = previousAddressSchema.safeParse(createAddress({ isCurrent: true }));
    expect(issuesFor(result).map((i) => i.path)).toEqual(["endMonth", "endYear"]);
  });

  it("reports only the missing half", () => {
    const result = previousAddressSchema.safeParse(pastAddress({ endYear: undefined }));
    expect(issuesFor(result).map((i) => i.path)).toEqual(["endYear"]);
  });

  it("inherits the base date range check", () => {
    const result = previousAddressSchema.safeParse(pastAddress({ startYear: "2023", endYear: "2022" }));
    expect(messageAt(result, "startMonth")).toBe("Start date must be before end date");
  });

  it("reports base field errors together with missing end dates", () => {
    const result = previousAddressSchema.safeParse(createAddress({ street: "", isCurrent: false }));
    expect(issuesFor(result).map((i) => i.path)).toEqual(["street", "endMonth", "endYear"]);
  });
});
