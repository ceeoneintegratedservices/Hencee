import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getProfileDoc,
  isCustomerRole,
  requireIdentity,
  requireProfile,
} from "./lib/auth";
import { profileMayAssignRoles } from "./lib/rbac";
import type { Id } from "./_generated/dataModel";

const SELF_SERVE_BLOCKED = new Set(["Admin", "Customer", "Staff"]);

export const myStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const profile = await getProfileDoc(ctx, identity.subject);
    if (!profile) {
      return null;
    }
    let pendingRequest: {
      _id: Id<"roleRequests">;
      requestedRoleId: Id<"roles">;
      roleName: string;
      createdAt: number;
    } | null = null;

    if (profile.pendingRoleRequestId) {
      const req = await ctx.db.get(profile.pendingRoleRequestId);
      if (req && req.status === "pending") {
        const role = await ctx.db.get(req.requestedRoleId);
        pendingRequest = {
          _id: req._id,
          requestedRoleId: req.requestedRoleId,
          roleName: role?.name ?? "Role",
          createdAt: req.createdAt,
        };
      }
    }

    return {
      mustSelectRole: profile.mustSelectRole === true,
      pendingRoleRequest: pendingRequest,
      approvalStatus: profile.approvalStatus ?? "approved",
      isCustomer: isCustomerRole(profile),
    };
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const actor = await requireProfile(ctx);
    if (!profileMayAssignRoles(actor)) {
      throw new Error("Forbidden");
    }
    const pending = await ctx.db
      .query("roleRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const out = [];
    for (const r of pending) {
      const profile = await ctx.db.get(r.profileId);
      const role = await ctx.db.get(r.requestedRoleId);
      if (profile && role) {
        out.push({
          id: r._id,
          createdAt: r.createdAt,
          requesterEmail: profile.email,
          requesterName: profile.name ?? profile.email,
          requestedRoleName: role.name,
          requestedRoleType: role.roleType,
          profileId: r.profileId,
          requestedRoleId: r.requestedRoleId,
        });
      }
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const createRequest = mutation({
  args: { requestedRoleId: v.id("roles") },
  handler: async (ctx, { requestedRoleId }) => {
    const identity = await requireIdentity(ctx);
    const profile = await getProfileDoc(ctx, identity.subject);
    if (!profile) {
      throw new Error("Profile not found");
    }
    if (isCustomerRole(profile)) {
      throw new Error("Not available for customer accounts");
    }
    if (profile.mustSelectRole !== true) {
      throw new Error("Role selection not required");
    }

    const role = await ctx.db.get(requestedRoleId);
    if (!role || SELF_SERVE_BLOCKED.has(role.roleType)) {
      throw new Error("Invalid role choice");
    }

    const existing = await ctx.db
      .query("roleRequests")
      .withIndex("by_profile_status", (q) =>
        q.eq("profileId", profile._id).eq("status", "pending")
      )
      .first();
    if (existing) {
      throw new Error("You already have a pending role request");
    }

    const reqId = await ctx.db.insert("roleRequests", {
      profileId: profile._id,
      requestedRoleId,
      status: "pending",
      createdAt: Date.now(),
    });

    await ctx.db.patch(profile._id, {
      mustSelectRole: false,
      pendingRoleRequestId: reqId,
      updatedAt: Date.now(),
    });

    return { ok: true, requestId: reqId };
  },
});

export const approve = mutation({
  args: { requestId: v.id("roleRequests") },
  handler: async (ctx, { requestId }) => {
    const actor = await requireProfile(ctx);
    if (!profileMayAssignRoles(actor)) {
      throw new Error("Forbidden");
    }

    const req = await ctx.db.get(requestId);
    if (!req || req.status !== "pending") {
      throw new Error("Request not found or not pending");
    }

    const role = await ctx.db.get(req.requestedRoleId);
    if (!role) {
      throw new Error("Role missing");
    }

    const profile = await ctx.db.get(req.profileId);
    if (!profile) {
      throw new Error("Profile missing");
    }

    const now = Date.now();
    await ctx.db.patch(requestId, {
      status: "approved",
      resolvedAt: now,
      resolvedByProfileId: actor._id,
    });

    await ctx.db.patch(req.profileId, {
      roleType: role.roleType,
      roleName: role.name,
      roleId: role._id,
      permissions: role.permissions,
      approvalStatus: "approved",
      mustSelectRole: false,
      pendingRoleRequestId: undefined,
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const reject = mutation({
  args: {
    requestId: v.id("roleRequests"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, note }) => {
    const actor = await requireProfile(ctx);
    if (!profileMayAssignRoles(actor)) {
      throw new Error("Forbidden");
    }

    const req = await ctx.db.get(requestId);
    if (!req || req.status !== "pending") {
      throw new Error("Request not found or not pending");
    }

    const now = Date.now();
    await ctx.db.patch(requestId, {
      status: "rejected",
      resolvedAt: now,
      resolvedByProfileId: actor._id,
      note,
    });

    await ctx.db.patch(req.profileId, {
      mustSelectRole: true,
      pendingRoleRequestId: undefined,
      updatedAt: now,
    });

    return { ok: true };
  },
});
