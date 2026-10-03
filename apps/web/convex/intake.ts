import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { parseIntake } from "../src/app/lib/intake/schema";

export const getIntake = query({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("intakes")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .unique();
  },
});

export const saveIntake = mutation({
  args: {
    applicationId: v.id("applications"),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const intake = parseIntake(args.payload);
    const existing = await ctx.db
      .query("intakes")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .unique();
    const updatedAt = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        payload: JSON.stringify(intake),
        updatedAt,
      });
      return existing._id;
    }
    return await ctx.db.insert("intakes", {
      applicationId: args.applicationId,
      payload: JSON.stringify(intake),
      updatedAt,
    });
  },
});
