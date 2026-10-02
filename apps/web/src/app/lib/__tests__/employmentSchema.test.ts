import { describe, it, expect } from "vitest";
import type { z } from "zod";
import { employmentBaseSchema, employmentSchema } from "../schemas/employmentSchema";

type EmploymentInput = z.input<typeof employmentSchema>;

const createEmployment = (overrides: Partial<EmploymentInput> = {}): EmploymentInput => ({
  id: "emp-1",
  status: "employed",
  employerName: "Acme Corp",
  fromMonth: "01",
  fromYear: "2020",
  isCurrent: true,
  ...overrides,
});

const pastEmployment = (overrides: Partial<EmploymentInput> = {}) =>
  createEmployment({ isCurrent: false, toMonth: "12", toYear: "2022", ...overrides });

const issuesFor = (result: z.ZodSafeParseResult<unknown>) =>
  result.success ? [] : result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));

const pathsFor = (result: z.ZodSafeParseResult<unknown>) => issuesFor(result).map((i) => i.path);

const messageAt = (result: z.ZodSafeParseResult<unknown>, path: string) =>
  issuesFor(result).find((i) => i.path === path)?.message;

describe("employmentBaseSchema", () => {
  it("fills defaults for omitted optional fields", () => {
    const result = employmentBaseSchema.parse({
      id: "emp-1",
      status: "student",
      fromMonth: "09",
      fromYear: "2019",
      isCurrent: true,
    });
    expect(result).toEqual({
      id: "emp-1",
      status: "student",
      employerName: "",
      jobTitle: "",
      city: "",
      state: "",
      country: "",
      fromMonth: "09",
      fromYear: "2019",
      toMonth: "",
      toYear: "",
      isCurrent: true,
      notes: "",
    });
  });

  it("preserves provided optional values", () => {
    const result = employmentBaseSchema.parse(
      pastEmployment({ jobTitle: "Engineer", city: "Austin", state: "TX", country: "USA", notes: "Remote" })
    );
    expect(result).toMatchObject({
      jobTitle: "Engineer",
      city: "Austin",
      state: "TX",
      country: "USA",
      notes: "Remote",
      toMonth: "12",
      toYear: "2022",
    });
  });

  it("does not apply cross-field refinements", () => {
    expect(employmentBaseSchema.safeParse(createEmployment({ employerName: "", isCurrent: false })).success).toBe(
      true
    );
  });
});

describe("employmentSchema", () => {
  describe("status", () => {
    it.each(["employed", "unemployed", "student", "other"] as const)("accepts %s", (status) => {
      expect(employmentSchema.safeParse(createEmployment({ status })).success).toBe(true);
    });

    it.each(["retired", "Employed", "", undefined, null, 1])("rejects %j", (status) => {
      const result = employmentSchema.safeParse(createEmployment({ status: status as EmploymentInput["status"] }));
      expect(result.success).toBe(false);
      expect(messageAt(result, "status")).toBe("Employment status is required");
    });
  });

  describe("employer name depends on status", () => {
    it.each(["", "   ", "\t\n", undefined])("requires an employer when employed (%j)", (employerName) => {
      const result = employmentSchema.safeParse(createEmployment({ employerName }));
      expect(result.success).toBe(false);
      expect(messageAt(result, "employerName")).toBe("Employer name is required when employed");
    });

    it.each(["unemployed", "student", "other"] as const)("does not require an employer when %s", (status) => {
      const result = employmentSchema.safeParse(createEmployment({ status, employerName: undefined }));
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.employerName).toBe("");
    });

    it("keeps surrounding whitespace in a valid employer name", () => {
      const result = employmentSchema.parse(createEmployment({ employerName: "  Acme  " }));
      expect(result.employerName).toBe("  Acme  ");
    });
  });

  describe("required start date", () => {
    it.each([
      ["fromMonth", "Start month is required"],
      ["fromYear", "Start year is required"],
    ] as const)("requires %s", (field, message) => {
      const result = employmentSchema.safeParse(createEmployment({ [field]: "" }));
      expect(messageAt(result, field)).toBe(message);
    });

    it("rejects a non-boolean isCurrent", () => {
      const result = employmentSchema.safeParse(createEmployment({ isCurrent: "true" as unknown as boolean }));
      expect(pathsFor(result)).toContain("isCurrent");
    });
  });

  describe("end date depends on isCurrent", () => {
    it("does not require an end date for current employment", () => {
      expect(employmentSchema.safeParse(createEmployment({ isCurrent: true })).success).toBe(true);
    });

    it("requires both end fields for past employment", () => {
      const result = employmentSchema.safeParse(createEmployment({ isCurrent: false }));
      expect(messageAt(result, "toMonth")).toBe("End month is required for past employment");
      expect(messageAt(result, "toYear")).toBe("End year is required for past employment");
    });

    it("reports only the missing end field", () => {
      expect(pathsFor(employmentSchema.safeParse(pastEmployment({ toMonth: "" })))).toEqual(["toMonth"]);
      expect(pathsFor(employmentSchema.safeParse(pastEmployment({ toYear: "" })))).toEqual(["toYear"]);
    });

    it("accepts a complete past employment", () => {
      expect(employmentSchema.safeParse(pastEmployment()).success).toBe(true);
    });
  });

  describe("date range refinement", () => {
    it("accepts start equal to end", () => {
      const result = employmentSchema.safeParse(
        pastEmployment({ fromMonth: "03", fromYear: "2021", toMonth: "03", toYear: "2021" })
      );
      expect(result.success).toBe(true);
    });

    it("rejects start after end and reports it on fromMonth", () => {
      const result = employmentSchema.safeParse(
        pastEmployment({ fromMonth: "04", fromYear: "2021", toMonth: "03", toYear: "2021" })
      );
      expect(pathsFor(result)).toEqual(["fromMonth"]);
      expect(messageAt(result, "fromMonth")).toBe("Start date must be before end date");
    });

    it("compares across year boundaries", () => {
      const result = employmentSchema.safeParse(
        pastEmployment({ fromMonth: "12", fromYear: "2020", toMonth: "01", toYear: "2021" })
      );
      expect(result.success).toBe(true);
    });

    it("ignores an inverted range for current employment", () => {
      const result = employmentSchema.safeParse(
        createEmployment({ isCurrent: true, fromYear: "2023", toMonth: "01", toYear: "2020" })
      );
      expect(result.success).toBe(true);
    });

    it("fails the range check when a year is not numeric", () => {
      const result = employmentSchema.safeParse(pastEmployment({ toYear: "n/a" }));
      expect(messageAt(result, "fromMonth")).toBe("Start date must be before end date");
    });
  });

  it("reports every cross-field issue at once", () => {
    const result = employmentSchema.safeParse(
      createEmployment({ fromMonth: "", employerName: "", isCurrent: false })
    );
    expect(pathsFor(result)).toEqual(["fromMonth", "employerName", "toMonth", "toYear"]);
  });

  // Asserts the intended behavior and currently fails; see the PR description.
  it.fails("rejects an out-of-range month", () => {
    const result = employmentSchema.safeParse(
      pastEmployment({ fromMonth: "13", fromYear: "2020", toMonth: "01", toYear: "2021" })
    );
    expect(result.success).toBe(false);
  });
});
