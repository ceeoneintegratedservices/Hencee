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
    const actor = await requireStaff(ctx);
    const list = Object.entries(permissions as Record<string, boolean>)
      .filter(([, v]) => v)
      .map(([k]) => k);
    await ctx.db.patch(userId, {
      permissions: list,
      updatedAt: Date.now(),
    });

    // Notify the affected user that their permissions were updated
    const targetProfile = await ctx.db.get(userId);
    if (targetProfile?.clerkId && targetProfile.clerkId !== actor.clerkId) {
      await ctx.db.insert("notifications", {
        userId: targetProfile.clerkId,
        title: "Permissions Updated",
        body: `Your account permissions have been updated by ${actor.name ?? "an administrator"}. The changes are now active.`,
        type: "user",
        read: false,
        createdAt: Date.now(),
      });
    }
  },
});
