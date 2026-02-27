import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  forms: defineTable({
    slug: v.string(),
    title: v.string(),
    pdfPath: v.string(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  applications: defineTable({
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  petitionerBasics: defineTable({
    applicationId: v.id("applications"),
    givenName: v.string(),
    middleName: v.optional(v.string()),
    familyName: v.string(),
    dateOfBirth: v.object({
      month: v.string(),
      day: v.string(),
      year: v.string(),
    }),
    placeOfBirth: v.optional(v.string()),
    citizenshipStatus: v.string(),
    relationship: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  }).index("by_application", ["applicationId"]),

  addresses: defineTable({
    applicationId: v.id("applications"),
    personRole: v.string(),
    street: v.string(),
    unit: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
    country: v.string(),
    startMonth: v.string(),
    startYear: v.string(),
    endMonth: v.optional(v.string()),
    endYear: v.optional(v.string()),
    isCurrent: v.boolean(),
    addressType: v.string(),
    sortOrder: v.number(),
  }).index("by_application_role", ["applicationId", "personRole"]),

  employmentEntries: defineTable({
    applicationId: v.id("applications"),
    personRole: v.string(),
    status: v.string(),
    employerName: v.string(),
    jobTitle: v.string(),
    employerAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.string(),
    fromMonth: v.string(),
    fromYear: v.string(),
    toMonth: v.optional(v.string()),
    toYear: v.optional(v.string()),
    isCurrent: v.boolean(),
    sortOrder: v.number(),
  }).index("by_application_role", ["applicationId", "personRole"]),
});
