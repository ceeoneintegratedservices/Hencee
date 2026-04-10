import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireStaff } from "./lib/auth";

async function getKey(ctx: QueryCtx, key: string) {
  return ctx.db
    .query("appSettings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
}

export const getSystem = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const doc = await getKey(ctx, "system");
    return doc?.value ?? {};
  },
});

export const setSystem = mutation({
  args: { value: v.any() },
  handler: async (ctx, { value }) => {
    await requireStaff(ctx);
    const existing = await getKey(ctx, "system");
    const t = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: t });
    } else {
      await ctx.db.insert("appSettings", { key: "system", value, updatedAt: t });
    }
  },
});

export const getUserPrefs = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return {};
  },
});

export const getUserProfileSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return {};
  },
});

export const getBusiness = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const doc = await getKey(ctx, "business");
    return doc?.value ?? {};
  },
});
