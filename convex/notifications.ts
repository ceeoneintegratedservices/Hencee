import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity, requireStaff } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(100);
  },
});

export const all = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return await ctx.db.query("notifications").order("desc").take(200);
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    await requireIdentity(ctx);
    await ctx.db.patch(notificationId, { read: true });
  },
});
