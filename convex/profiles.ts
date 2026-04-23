import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireIdentity, getProfileDoc, requireStaff } from "./lib/auth";

const DEFAULT_ADMIN_PERMISSIONS = [
  "view_users",
  "users.view",
  "users.assign_roles",
  "view_reports",
  "reports.view",
  "inventory.view",
  "products.view",
  "approvals.view",
  "expenses.view",
  "expenses.create",
  "expenses.edit",
  "expenses.delete",
  "approval.view_requests",
  "approve.payment_request",
  "approve.invoice_request",
  "approve.refund",
  "approve.user_accounts",
  "approve.daily_expense",
  "approve.void",
];

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return getProfileDoc(ctx, identity.subject);
  },
});

export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const now = Date.now();
    const existing = await getProfileDoc(ctx, identity.subject);
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastLoginAt: now,
        updatedAt: now,
        imageUrl: identity.pictureUrl ?? existing.imageUrl,
        name: identity.name ?? existing.name,
      });
      return existing._id;
    }

    const all = await ctx.db.query("profiles").collect();
    const isFirstUser = all.length === 0;

    const email = String(
      identity.email ??
        identity.emailAddress ??
        (identity as { tokenIdentifier?: string }).tokenIdentifier?.split("|").pop() ??
        "unknown@user.local"
    ).toLowerCase();

    const byEmail = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (byEmail) {
      await ctx.db.patch(byEmail._id, {
        clerkId: identity.subject,
        lastLoginAt: now,
        updatedAt: now,
        imageUrl: identity.pictureUrl ?? byEmail.imageUrl,
        name: identity.name ?? byEmail.name,
      });
      return byEmail._id;
    }

    const profileId = await ctx.db.insert("profiles", {
      clerkId: identity.subject,
      email,
      name: identity.name ?? undefined,
      imageUrl: identity.pictureUrl ?? undefined,
      roleType: isFirstUser ? "Admin" : "Staff",
      roleName: isFirstUser ? "admin" : "staff",
      permissions: isFirstUser ? DEFAULT_ADMIN_PERMISSIONS : [],
      approvalStatus: isFirstUser ? "approved" : "pending",
      mustSelectRole: isFirstUser ? false : true,
      isActive: true,
      isEmailVerified: true,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const adminRole = await ctx.db
      .query("roles")
      .withIndex("by_roleType", (q) => q.eq("roleType", "Admin"))
      .unique();
    const staffRole = await ctx.db
      .query("roles")
      .withIndex("by_roleType", (q) => q.eq("roleType", "Staff"))
      .unique();

    if (isFirstUser && adminRole) {
      await ctx.db.patch(profileId, { roleId: adminRole._id, updatedAt: now });
    } else if (!isFirstUser && staffRole) {
      await ctx.db.patch(profileId, { roleId: staffRole._id, updatedAt: now });
    }

    return profileId;
  },
});

export const upsertClerkWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        name: [args.firstName, args.lastName].filter(Boolean).join(" ") || existing.name,
        imageUrl: args.imageUrl ?? existing.imageUrl,
        updatedAt: now,
      });
      return existing._id;
    }

    const all = await ctx.db.query("profiles").collect();
    const isFirstUser = all.length === 0;

    return ctx.db.insert("profiles", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      name: [args.firstName, args.lastName].filter(Boolean).join(" ") || args.email,
      imageUrl: args.imageUrl,
      roleType: isFirstUser ? "Admin" : "Staff",
      roleName: isFirstUser ? "admin" : "staff",
      permissions: isFirstUser ? DEFAULT_ADMIN_PERMISSIONS : [],
      approvalStatus: isFirstUser ? "approved" : "pending",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const linkCustomer = mutation({
  args: {
    profileId: v.id("profiles"),
    customerId: v.id("customers"),
  },
  handler: async (ctx, { profileId, customerId }) => {
    await requireStaff(ctx);
    const customerRole = await ctx.db
      .query("roles")
      .withIndex("by_roleType", (q) => q.eq("roleType", "Customer"))
      .unique();

    await ctx.db.patch(profileId, {
      customerId,
      roleType: "Customer",
      roleName: "customer",
      roleId: customerRole?._id,
      mustSelectRole: false,
      pendingRoleRequestId: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const updateMyPermissions = mutation({
  args: {
    permissions: v.array(v.string()),
  },
  handler: async (ctx, { permissions }) => {
    const identity = await requireIdentity(ctx);
    const profile = await getProfileDoc(ctx, identity.subject);
    if (!profile) {
      throw new Error("No profile");
    }
    await ctx.db.patch(profile._id, {
      permissions,
      updatedAt: Date.now(),
    });
  },
});
