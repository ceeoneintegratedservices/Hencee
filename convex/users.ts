import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStaff } from "./lib/auth";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

function mapUser(p: Doc<"profiles">): {
  id: string;
  email: string;
  name: string;
  phone: string;
  isActive: boolean;
  isEmailVerified: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
    description: string;
    roleType: string;
    permissions: string[];
  };
} {
  const perms = p.permissions ?? [];
  return {
    id: p._id,
    email: p.email,
    name: p.name ?? p.email,
    phone: p.phone ?? "",
    isActive: p.isActive ?? true,
    isEmailVerified: p.isEmailVerified ?? false,
    approvalStatus: p.approvalStatus,
    lastLoginAt: p.lastLoginAt ? new Date(p.lastLoginAt).toISOString() : null,
    createdAt: new Date(p.createdAt).toISOString(),
    updatedAt: new Date(p.updatedAt).toISOString(),
    role: {
      id: p.roleId ?? p.roleType ?? "role",
      name: p.roleName ?? p.roleType ?? "user",
      description: "",
      roleType: p.roleType ?? "",
      permissions: perms,
    },
  };
}

export const listUsers = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    let rows = await ctx.db.query("profiles").collect();
    if (args.search) {
      const s = args.search.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.email.toLowerCase().includes(s) ||
          (p.name?.toLowerCase().includes(s) ?? false)
      );
    }
    const limit = args.limit ?? 50;
    const page = args.page ?? 1;
    const total = rows.length;
    const start = (page - 1) * limit;
    const users = rows.slice(start, start + limit).map(mapUser);
    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },
});

export const getUser = query({
  args: { id: v.id("profiles") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    const p = await ctx.db.get(id);
    if (!p) {
      throw new Error("Not found");
    }
    return mapUser(p);
  },
});

export const updateUser = mutation({
  args: {
    id: v.id("profiles"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...patch }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
    const p = await ctx.db.get(id);
    return mapUser(p!);
  },
});

async function getRoleDoc(ctx: MutationCtx, roleId: string) {
  const byId = await ctx.db.get(roleId as Id<"roles">);
  if (byId) {
    return byId;
  }
  return ctx.db
    .query("roles")
    .withIndex("by_roleType", (q) => q.eq("roleType", roleId))
    .unique();
}

export const assignRole = mutation({
  args: {
    id: v.id("profiles"),
    roleId: v.string(),
    permissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, roleId, permissions }) => {
    await requireStaff(ctx);
    const role = await getRoleDoc(ctx, roleId);
    if (!role) {
      throw new Error("Role not found. Run roles:seedRoles if the roles table is empty.");
    }
    await ctx.db.patch(id, {
      roleType: role.roleType,
      roleName: role.name,
      roleId: role._id,
      permissions: permissions ?? role.permissions,
      mustSelectRole: false,
      pendingRoleRequestId: undefined,
      updatedAt: Date.now(),
    });
    return mapUser((await ctx.db.get(id))!);
  },
});

export const assignFirstAdminByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();
    const all = await ctx.db.query("profiles").collect();
    const hasAdmin = all.some(
      (p) => p.roleType === "Admin" && p.approvalStatus === "approved"
    );
    if (hasAdmin) {
      throw new Error(
        "An administrator already exists. Use Users & Roles to assign roles instead."
      );
    }
    const adminRole = await ctx.db
      .query("roles")
      .withIndex("by_roleType", (q) => q.eq("roleType", "Admin"))
      .unique();
    if (!adminRole) {
      throw new Error("Administrator role not found. Run roles:seedRoles first.");
    }
    const profile = all.find((p) => p.email.toLowerCase() === normalized);
    if (!profile) {
      throw new Error(
        "No profile for that email. Sign in once with Clerk so Convex can create the profile."
      );
    }
    const t = Date.now();
    await ctx.db.patch(profile._id, {
      roleType: adminRole.roleType,
      roleName: adminRole.name,
      roleId: adminRole._id,
      permissions: adminRole.permissions,
      approvalStatus: "approved",
      mustSelectRole: false,
      pendingRoleRequestId: undefined,
      updatedAt: t,
    });
    return { ok: true as const, profileId: profile._id };
  },
});

export const deactivateUser = mutation({
  args: { id: v.id("profiles") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { isActive: false, updatedAt: Date.now() });
    return mapUser((await ctx.db.get(id))!);
  },
});

export const activateUser = mutation({
  args: { id: v.id("profiles") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { isActive: true, updatedAt: Date.now() });
    return mapUser((await ctx.db.get(id))!);
  },
});

export const deleteUser = mutation({
  args: { id: v.id("profiles") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.delete(id);
  },
});

export const verifyEmail = mutation({
  args: { id: v.id("profiles") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { isEmailVerified: true, updatedAt: Date.now() });
    return mapUser((await ctx.db.get(id))!);
  },
});

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.string(),
    roleId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const role = await getRoleDoc(ctx, args.roleId);
    const t = Date.now();
    const id = await ctx.db.insert("profiles", {
      clerkId: `pending:${args.email}`,
      email: args.email,
      name: args.name,
      phone: args.phone,
      roleType: role?.roleType ?? args.roleId,
      roleName: role?.name ?? args.roleId,
      roleId: role?._id,
      permissions: role?.permissions ?? [],
      approvalStatus: "pending",
      mustSelectRole: true,
      isActive: false,
      createdAt: t,
      updatedAt: t,
    });
    return mapUser((await ctx.db.get(id))!);
  },
});
