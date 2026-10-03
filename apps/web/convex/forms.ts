import { query } from "./_generated/server";
import { requireUserId } from "./authz";

export const listForms = query({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.db.query("forms").collect();
  },
});
