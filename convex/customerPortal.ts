import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProfileDoc, requireIdentity } from "./lib/auth";
async function requireCustomer(ctx: Parameters<typeof getProfileDoc>[0]) {
  const identity = await requireIdentity(ctx);
  const profile = await getProfileDoc(ctx, identity.subject);
  if (!profile?.customerId) {
    throw new Error("Customer profile not linked");
  }
  const customer = await ctx.db.get(profile.customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }
  return { profile, customer };
}

export const me = query({
  args: {},
  handler: async (ctx) => {
    const { customer } = await requireCustomer(ctx);
    return {
      id: customer._id,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      name: customer.name,
      profileImageUrl: customer.profileImageUrl,
    };
  },
});

export const updateMe = mutation({
  args: {
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, patch) => {
    const { customer } = await requireCustomer(ctx);
    await ctx.db.patch(customer._id, { ...patch, updatedAt: Date.now() });
    return ctx.db.get(customer._id);
  },
});

export const myOrders = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { customer } = await requireCustomer(ctx);
    let rows = await ctx.db
      .query("sales")
      .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
      .collect();
    if (args.status) {
      rows = rows.filter((r) => r.status === args.status);
    }
    return { data: rows, total: rows.length, page: args.page ?? 1, limit: args.limit ?? 50 };
  },
});

export const createOrder = mutation({
  args: {
    items: v.any(),
    totalAmount: v.number(),
  },
  handler: async (ctx, { items, totalAmount }) => {
    const { customer } = await requireCustomer(ctx);
    const t = Date.now();
    const orderNumber = `ORD-${t}`;
    const id = await ctx.db.insert("sales", {
      customerId: customer._id,
      orderNumber,
      orderDate: new Date(t).toISOString(),
      trackingId: `TRK-${t}`,
      status: "Pending",
      items,
      totalAmount,
      createdAt: t,
      updatedAt: t,
    });
    return await ctx.db.get(id);
  },
});

export const searchProducts = query({
  args: {
    q: v.optional(v.string()),
    /** Alias for legacy Ceeone `catalog/search?query=` clients */
    query: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCustomer(ctx);
    const searchText = (args.q ?? args.query ?? "").trim();
    let rows = await ctx.db.query("inventoryItems").collect();
    if (searchText) {
      const s = searchText.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(s));
    }
    return rows.slice(0, 50);
  },
});

export const myDebts = query({
  args: {},
  handler: async (ctx) => {
    const { customer } = await requireCustomer(ctx);
    const bal = customer.outstandingBalance ?? 0;
    if (bal <= 0) {
      return [];
    }
    const due = new Date().toISOString();
    return [
      {
        id: "aggregate",
        orderId: "",
        orderNumber: undefined,
        totalAmount: bal,
        paidAmount: 0,
        outstandingBalance: bal,
        dueDate: due,
        createdAt: due,
        status: "OUTSTANDING",
      },
    ];
  },
});

export const payDebt = mutation({
  args: { amount: v.number() },
  handler: async (ctx, { amount }) => {
    const { customer } = await requireCustomer(ctx);
    const ob = customer.outstandingBalance ?? 0;
    await ctx.db.patch(customer._id, {
      outstandingBalance: Math.max(0, ob - amount),
      updatedAt: Date.now(),
    });
    return { success: true, message: "ok" };
  },
});

export const requestRefund = mutation({
  args: { payload: v.any() },
  handler: async (ctx, { payload }) => {
    const { customer } = await requireCustomer(ctx);
    const t = Date.now();
    await ctx.db.insert("refundRequests", {
      customerId: customer._id,
      status: "pending",
      payload,
      createdAt: t,
      updatedAt: t,
    });
    return { success: true, message: "submitted" };
  },
});

export const createTicket = mutation({
  args: { subject: v.string(), body: v.optional(v.string()) },
  handler: async (ctx, { subject, body }) => {
    const identity = await requireIdentity(ctx);
    const { customer } = await requireCustomer(ctx);
    const t = Date.now();
    const tid = await ctx.db.insert("supportTickets", {
      customerId: customer._id,
      clerkUserId: identity.subject,
      subject,
      body,
      status: "open",
      createdAt: t,
      updatedAt: t,
    });
    return await ctx.db.get(tid);
  },
});

export const notifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});
