import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStaff } from "./lib/auth";

function ts() {
  return Date.now();
}

export const list = query({
  args: {
    status: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    let rows = await ctx.db.query("approvals").order("desc").collect();
    if (args.status) {
      rows = rows.filter((r) => r.status === args.status);
    }
    if (args.type) {
      rows = rows.filter((r) => r.type === args.type);
    }
    return rows;
  },
});

export const pending = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return (await ctx.db.query("approvals").collect()).filter((a) => a.status === "pending");
  },
});

export const get = query({
  args: { id: v.id("approvals") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    const a = await ctx.db.get(id);
    if (!a) {
      throw new Error("Not found");
    }
    return a;
  },
});

export const create = mutation({
  args: { type: v.string(), title: v.optional(v.string()), amount: v.optional(v.number()), payload: v.optional(v.any()) },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const t = ts();
    return ctx.db.insert("approvals", {
      type: args.type,
      status: "pending",
      title: args.title,
      amount: args.amount,
      payload: args.payload,
      createdAt: t,
      updatedAt: t,
    });
  },
});

export const approve = mutation({
  args: { id: v.id("approvals") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { status: "approved", resolvedAt: ts(), updatedAt: ts() });
    return ctx.db.get(id);
  },
});

export const reject = mutation({
  args: { id: v.id("approvals"), reason: v.optional(v.string()) },
  handler: async (ctx, { id, reason }) => {
    await requireStaff(ctx);
    const cur = await ctx.db.get(id);
    const prev = (cur?.payload ?? {}) as Record<string, unknown>;
    await ctx.db.patch(id, {
      status: "rejected",
      resolvedAt: ts(),
      updatedAt: ts(),
      payload: reason ? { ...prev, rejectionReason: reason } : prev,
    });
    return ctx.db.get(id);
  },
});

/** Request more information without rejecting — item stays pending for resubmission. */
export const queryRequest = mutation({
  args: { id: v.id("approvals"), note: v.string() },
  handler: async (ctx, { id, note }) => {
    await requireStaff(ctx);
    const cur = await ctx.db.get(id);
    if (!cur) {
      throw new Error("Not found");
    }
    const prev = (cur?.payload ?? {}) as Record<string, unknown>;
    const queries = Array.isArray(prev.queries)
      ? [...(prev.queries as { note: string; at: number }[])]
      : [];
    queries.push({ note, at: ts() });
    await ctx.db.patch(id, {
      status: "queried",
      updatedAt: ts(),
      payload: { ...prev, queryNote: note, queries },
    });
    return ctx.db.get(id);
  },
});

export const markPaid = mutation({
  args: { id: v.id("approvals") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, {
      status: "paid",
      resolvedAt: ts(),
      updatedAt: ts(),
    });
    return ctx.db.get(id);
  },
});

export const pendingAccounts = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return (await ctx.db.query("profiles").collect()).filter((p) => p.approvalStatus === "pending");
  },
});

export const approveAccount = mutation({
  args: { userId: v.id("profiles") },
  handler: async (ctx, { userId }) => {
    await requireStaff(ctx);
    const now = ts();
    await ctx.db.patch(userId, { approvalStatus: "approved", updatedAt: now });
    const profile = await ctx.db.get(userId);
    if (profile?.clerkId) {
      await ctx.db.insert("notifications", {
        userId: profile.clerkId,
        title: "Account Approved",
        body: "Your account has been approved. You can now log in and use the platform.",
        type: "user",
        read: false,
        createdAt: now,
      });
    }
    return ctx.db.get(userId);
  },
});

export const rejectAccount = mutation({
  args: { userId: v.id("profiles"), reason: v.string() },
  handler: async (ctx, { userId }) => {
    await requireStaff(ctx);
    const now = ts();
    await ctx.db.patch(userId, { approvalStatus: "rejected", updatedAt: now });
    const profile = await ctx.db.get(userId);
    if (profile?.clerkId) {
      await ctx.db.insert("notifications", {
        userId: profile.clerkId,
        title: "Account Not Approved",
        body: "Your account registration was not approved. Please contact the administrator for more information.",
        type: "user",
        read: false,
        createdAt: now,
      });
    }
    return ctx.db.get(userId);
  },
});

export const refundList = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return await ctx.db.query("refundRequests").collect();
  },
});

export const pendingRefunds = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return (await ctx.db.query("refundRequests").collect()).filter((r) => r.status === "pending");
  },
});

export const pendingCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const approvals = await ctx.db.query("approvals").collect();
    const accounts = await ctx.db.query("profiles").collect();
    const refunds = await ctx.db.query("refundRequests").collect();
    return {
      expenses: approvals.filter((a) => a.type === "expense" && a.status === "pending").length,
      accounts: accounts.filter((p) => p.approvalStatus === "pending").length,
      refunds: refunds.filter((r) => r.status === "pending").length,
    };
  },
});

export const refundGet = query({
  args: { id: v.id("refundRequests") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    const r = await ctx.db.get(id);
    if (!r) {
      throw new Error("Not found");
    }
    return r;
  },
});

export const createRefund = mutation({
  args: {
    saleId: v.id("sales"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const t = ts();
    const sale = await ctx.db.get(args.saleId);
    const rid = await ctx.db.insert("refundRequests", {
      saleId: args.saleId,
      customerId: sale?.customerId,
      status: "pending",
      amount: args.amount,
      reason: args.reason,
      createdAt: t,
      updatedAt: t,
    });
    return ctx.db.get(rid);
  },
});

export const approveRefundRequest = mutation({
  args: {
    id: v.id("refundRequests"),
    refundMethod: v.optional(v.string()),
    refundReference: v.optional(v.string()),
  },
  handler: async (ctx, { id, refundMethod, refundReference }) => {
    await requireStaff(ctx);
    const cur = await ctx.db.get(id);
    const prev = (cur?.payload ?? {}) as Record<string, unknown>;
    await ctx.db.patch(id, {
      status: "approved",
      updatedAt: ts(),
      payload: { ...prev, refundMethod, refundReference },
    });
    return ctx.db.get(id);
  },
});

export const rejectRefundRequest = mutation({
  args: { id: v.id("refundRequests"), reason: v.string() },
  handler: async (ctx, { id, reason }) => {
    await requireStaff(ctx);
    const cur = await ctx.db.get(id);
    const prev = (cur?.payload ?? {}) as Record<string, unknown>;
    await ctx.db.patch(id, {
      status: "rejected",
      updatedAt: ts(),
      payload: { ...prev, rejectionReason: reason },
    });
    return ctx.db.get(id);
  },
});

export const markRefundProcessed = mutation({
  args: { id: v.id("refundRequests") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { status: "processed", updatedAt: ts() });
    return ctx.db.get(id);
  },
});
