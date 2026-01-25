import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  forms: defineTable({
    slug: v.string(),
    title: v.string(),
    pdfPath: v.string(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),
});
