import { query } from "./_generated/server";
import { requireStaff } from "./lib/auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const doc = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "pharmaPresets"))
      .unique();
    return doc?.value ?? { categories: [], units: [] };
  },
});
