import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStaff } from "./lib/auth";

export const listRoles = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("roles").collect();
    if (rows.length === 0) {
      return [];
    }
    return rows.map((r) => ({
      id: r._id,
      name: r.name,
      description: r.description,
      roleType: r.roleType,
      permissions: r.permissions,
    }));
  },
});

export const saveUserPermissions = mutation({
  args: {
    userId: v.id("profiles"),
    permissions: v.any(),
  },
  handler: async (ctx, { userId, permissions }) => {
    await requireStaff(ctx);
    const list = Object.entries(permissions as Record<string, boolean>)
      .filter(([, v]) => v)
      .map(([k]) => k);
    await ctx.db.patch(userId, {
      permissions: list,
      updatedAt: Date.now(),
    });
  },
});
