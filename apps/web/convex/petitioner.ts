import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  requireOwnedAddress,
  requireOwnedApplication,
  requireOwnedEmployment,
  requireUserId,
} from "./authz";

async function applicationForUser(ctx: MutationCtx) {
  const userId = await requireUserId(ctx);
  const existing = await ctx.db
    .query("applications")
    .withIndex("by_owner", (q) => q.eq("ownerId", userId))
    .first();
  if (existing) return existing._id;
  const now = Date.now();
  return await ctx.db.insert("applications", {
    ownerId: userId,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  });
}

export const createApplication = mutation({
  args: {},
  handler: async (ctx) => applicationForUser(ctx),
});

export const getOrCreateApplication = mutation({
  args: {},
  handler: async (ctx) => applicationForUser(ctx),
});

// ── Petitioner Basics ──

const petitionerBasicsArgs = {
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
};

export const savePetitionerBasics = mutation({
  args: petitionerBasicsArgs,
  handler: async (ctx, args) => {
    await requireOwnedApplication(ctx, args.applicationId);
    const existing = await ctx.db
      .query("petitionerBasics")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("petitionerBasics", args);
  },
});

export const getPetitionerBasics = query({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, args) => {
    await requireOwnedApplication(ctx, args.applicationId);
    const row = await ctx.db
      .query("petitionerBasics")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .first();
    if (!row) return null;
    const { ssn, aNumber, ...rest } = row;
    return {
      ...rest,
      ssnLast4: ssn?.last4 ?? null,
      aNumberLast4: aNumber?.last4 ?? null,
    };
  },
});

// ── Addresses ──

const addressArgs = {
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
};

export const saveAddress = mutation({
  args: { _id: v.optional(v.id("addresses")), ...addressArgs },
  handler: async (ctx, { _id, ...data }) => {
    await requireOwnedApplication(ctx, data.applicationId);
    if (_id) {
      await requireOwnedAddress(ctx, _id);
      await ctx.db.patch(_id, data);
      return _id;
    }
    return await ctx.db.insert("addresses", data);
  },
});

export const listAddresses = query({
  args: { applicationId: v.id("applications"), personRole: v.string() },
  handler: async (ctx, args) => {
    await requireOwnedApplication(ctx, args.applicationId);
    return await ctx.db
      .query("addresses")
      .withIndex("by_application_role", (q) =>
        q.eq("applicationId", args.applicationId).eq("personRole", args.personRole)
      )
      .collect();
  },
});

export const removeAddress = mutation({
  args: { id: v.id("addresses") },
  handler: async (ctx, args) => {
    await requireOwnedAddress(ctx, args.id);
    await ctx.db.delete(args.id);
  },
});

// ── Employment Entries ──

const employmentArgs = {
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
};

export const saveEmploymentEntry = mutation({
  args: { _id: v.optional(v.id("employmentEntries")), ...employmentArgs },
  handler: async (ctx, { _id, ...data }) => {
    await requireOwnedApplication(ctx, data.applicationId);
    if (_id) {
      await requireOwnedEmployment(ctx, _id);
      await ctx.db.patch(_id, data);
      return _id;
    }
    return await ctx.db.insert("employmentEntries", data);
  },
});

export const listEmploymentEntries = query({
  args: { applicationId: v.id("applications"), personRole: v.string() },
  handler: async (ctx, args) => {
    await requireOwnedApplication(ctx, args.applicationId);
    return await ctx.db
      .query("employmentEntries")
      .withIndex("by_application_role", (q) =>
        q.eq("applicationId", args.applicationId).eq("personRole", args.personRole)
      )
      .collect();
  },
});

export const removeEmploymentEntry = mutation({
  args: { id: v.id("employmentEntries") },
  handler: async (ctx, args) => {
    await requireOwnedEmployment(ctx, args.id);
    await ctx.db.delete(args.id);
  },
});

async function purgeOwnedApplications(ctx: MutationCtx, userId: string) {
  const applications = await ctx.db
    .query("applications")
    .withIndex("by_owner", (q) => q.eq("ownerId", userId))
    .collect();
  for (const application of applications) {
    const basics = await ctx.db
      .query("petitionerBasics")
      .withIndex("by_application", (q) => q.eq("applicationId", application._id))
      .collect();
    for (const row of basics) await ctx.db.delete(row._id);
    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_application_role", (q) => q.eq("applicationId", application._id))
      .collect();
    for (const row of addresses) await ctx.db.delete(row._id);
    const employment = await ctx.db
      .query("employmentEntries")
      .withIndex("by_application_role", (q) => q.eq("applicationId", application._id))
      .collect();
    for (const row of employment) await ctx.db.delete(row._id);
    const intakes = await ctx.db
      .query("intakes")
      .withIndex("by_application", (q) => q.eq("applicationId", application._id))
      .collect();
    for (const row of intakes) await ctx.db.delete(row._id);
    await ctx.db.delete(application._id);
  }
  return { deleted: applications.length };
}

export const deleteMyApplication = mutation({
  args: {},
  handler: async (ctx) => purgeOwnedApplications(ctx, await requireUserId(ctx)),
});

export const purgeOwner = internalMutation({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => purgeOwnedApplications(ctx, args.ownerId),
});
