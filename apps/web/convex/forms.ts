import { query } from "./_generated/server";

export const listForms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("forms").collect();
  },
});
