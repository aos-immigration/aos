import { describe, it, expect } from "vitest";
import type { z } from "zod";
import { dateOfBirthSchema, petitionerBasicsSchema } from "../schemas/petitionerBasicsSchema";

type PetitionerInput = z.input<typeof petitionerBasicsSchema>;

const createPetitioner = (overrides: Partial<PetitionerInput> = {}): PetitionerInput => ({
  givenName: "Jane",
  familyName: "Doe",
  dateOfBirth: { month: "05", day: "14", year: "1985" },
  citizenshipStatus: "us_citizen",
  relationship: "spouse",
  ...overrides,
});

const issuesFor = (result: z.ZodSafeParseResult<unknown>) =>
  result.success ? [] : result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));

const messageAt = (result: z.ZodSafeParseResult<unknown>, path: string) =>
  issuesFor(result).find((i) => i.path === path)?.message;

const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const;

describe("dateOfBirthSchema", () => {
  it.each(months)("accepts month %s", (month) => {
    expect(dateOfBirthSchema.safeParse({ month, day: "1", year: "1990" }).success).toBe(true);
  });

  it.each(["1", "00", "13", "Jan", "", undefined, 1])("rejects month %j", (month) => {
    const result = dateOfBirthSchema.safeParse({ month, day: "1", year: "1990" });
    expect(messageAt(result, "month")).toBe("Month is required");
  });

  it("requires day and year", () => {
    const result = dateOfBirthSchema.safeParse({ month: "01", day: "", year: "" });
    expect(messageAt(result, "day")).toBe("Day is required");
    expect(messageAt(result, "year")).toBe("Year is required");
  });

  it("rejects a missing object", () => {
    expect(dateOfBirthSchema.safeParse(undefined).success).toBe(false);
  });

  // Assert the intended behavior and currently fail; see the PR description.
  it.fails("rejects an impossible day", () => {
    expect(dateOfBirthSchema.safeParse({ month: "02", day: "31", year: "1990" }).success).toBe(false);
  });

  it.fails("rejects a non-numeric year", () => {
    expect(dateOfBirthSchema.safeParse({ month: "02", day: "1", year: "abc" }).success).toBe(false);
  });
});

describe("petitionerBasicsSchema", () => {
  it("fills defaults for omitted optional fields", () => {
    expect(petitionerBasicsSchema.parse(createPetitioner())).toEqual({
      givenName: "Jane",
      middleName: "",
      familyName: "Doe",
      dateOfBirth: { month: "05", day: "14", year: "1985" },
      placeOfBirth: "",
      citizenshipStatus: "us_citizen",
      relationship: "spouse",
      email: "",
      phone: "",
    });
  });

  it("strips unknown keys", () => {
    const result = petitionerBasicsSchema.parse({ ...createPetitioner(), extra: "x" } as PetitionerInput);
    expect(result).not.toHaveProperty("extra");
  });

  it.each([
    ["givenName", "Given (first) name is required"],
    ["familyName", "Family (last) name is required"],
  ] as const)("requires %s", (field, message) => {
    const result = petitionerBasicsSchema.safeParse(createPetitioner({ [field]: "" }));
    expect(messageAt(result, field)).toBe(message);
  });

  it("nests date-of-birth error paths", () => {
    const result = petitionerBasicsSchema.safeParse(
      createPetitioner({ dateOfBirth: { month: "13" as "01", day: "", year: "1990" } })
    );
    expect(issuesFor(result).map((i) => i.path)).toEqual(["dateOfBirth.month", "dateOfBirth.day"]);
  });

  describe("citizenshipStatus", () => {
    it.each(["us_citizen", "lpr"] as const)("accepts %s", (citizenshipStatus) => {
      expect(petitionerBasicsSchema.safeParse(createPetitioner({ citizenshipStatus })).success).toBe(true);
    });

    it.each(["citizen", "LPR", "", undefined])("rejects %j", (citizenshipStatus) => {
      const result = petitionerBasicsSchema.safeParse(
        createPetitioner({ citizenshipStatus: citizenshipStatus as PetitionerInput["citizenshipStatus"] })
      );
      expect(messageAt(result, "citizenshipStatus")).toBe("Citizenship status is required");
    });
  });

  describe("relationship", () => {
    it.each(["spouse", "parent", "child", "sibling"] as const)("accepts %s", (relationship) => {
      expect(petitionerBasicsSchema.safeParse(createPetitioner({ relationship })).success).toBe(true);
    });

    it.each(["cousin", "Spouse", "", undefined])("rejects %j", (relationship) => {
      const result = petitionerBasicsSchema.safeParse(
        createPetitioner({ relationship: relationship as PetitionerInput["relationship"] })
      );
      expect(messageAt(result, "relationship")).toBe("Relationship is required");
    });
  });

  describe("email", () => {
    it.each([undefined, ""])("allows %j", (email) => {
      const result = petitionerBasicsSchema.safeParse(createPetitioner({ email }));
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBe("");
    });

    it.each(["jane@example.com", "jane.doe+tag@mail.example.co.uk"])("accepts %s", (email) => {
      expect(petitionerBasicsSchema.safeParse(createPetitioner({ email })).success).toBe(true);
    });

    it.each(["jane", "jane@example", "@example.com", "jane@.com", "jane doe@example.com", "jane@@example.com", " "])(
      "rejects %j",
      (email) => {
        const result = petitionerBasicsSchema.safeParse(createPetitioner({ email }));
        expect(messageAt(result, "email")).toBe("Please enter a valid email address");
      }
    );
  });

  // Asserts the intended behavior and currently fails; see the PR description.
  it.fails("rejects whitespace-only names", () => {
    expect(petitionerBasicsSchema.safeParse(createPetitioner({ givenName: "  " })).success).toBe(false);
  });
});
