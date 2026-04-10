import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireStaff } from "./lib/auth";

export const list = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    userId: v.optional(v.string()),
    action: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    let rows = await ctx.db.query("auditLogs").order("desc").collect();
    if (args.userId) {
      rows = rows.filter((r) => r.userId === args.userId);
    }
    if (args.action) {
      rows = rows.filter((r) => r.action === args.action);
    }
    if (args.entityType) {
      rows = rows.filter((r) => r.resource === args.entityType);
    }
    if (args.entityId) {
      rows = rows.filter((r) => r.resourceId === args.entityId);
    }
    if (args.startDate) {
      const t = new Date(args.startDate).getTime();
      rows = rows.filter((r) => r.createdAt >= t);
    }
    if (args.endDate) {
      const end = new Date(args.endDate);
      end.setHours(23, 59, 59, 999);
      const t = end.getTime();
      rows = rows.filter((r) => r.createdAt <= t);
    }
    const total = rows.length;
    const limit = Math.min(args.limit ?? 50, 200);
    const page = Math.max(args.page ?? 1, 1);
    const start = (page - 1) * limit;
    const slice = rows.slice(start, start + limit);
    return { data: slice, total, page, limit };
  },
});
