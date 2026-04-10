import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireStaff } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

function ts() {
  return Date.now();
}

function mapCustomer(c: {
  _id: Id<"customers">;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  creditLimit?: number;
  outstandingBalance?: number;
  customerSince?: string;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: c._id,
    name: c.name,
    email: c.email ?? "",
    phone: c.phone ?? "",
    address: c.address,
    status: c.status ?? "Active",
    creditLimit: c.creditLimit,
    outstandingBalance: c.outstandingBalance,
    customerSince: c.customerSince ?? new Date(c.createdAt).toISOString(),
    createdAt: new Date(c.createdAt).toISOString(),
    updatedAt: new Date(c.updatedAt).toISOString(),
  };
}

async function filteredCustomers(ctx: QueryCtx, search?: string) {
  let rows = await ctx.db.query("customers").order("desc").collect();
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.email?.toLowerCase().includes(s) ?? false) ||
        (c.phone?.toLowerCase().includes(s) ?? false)
    );
  }
  return rows;
}

export const listPaginated = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const limit = Math.min(args.limit ?? 50, 200);
    const page = Math.max(args.page ?? 1, 1);
    const rows = await filteredCustomers(ctx, args.search);
    const total = rows.length;
    const start = (page - 1) * limit;
    const data = rows.slice(start, start + limit).map(mapCustomer);
    return { data, total, page, limit };
  },
});

export const get = query({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    const c = await ctx.db.get(id);
    if (!c) {
      throw new Error("Not found");
    }
    return mapCustomer(c);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    status: v.optional(v.string()),
    creditLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const t = ts();
    const id = await ctx.db.insert("customers", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      address: args.address,
      status: args.status ?? "Active",
      creditLimit: args.creditLimit,
      outstandingBalance: 0,
      customerSince: new Date(t).toISOString(),
      createdAt: t,
      updatedAt: t,
    });
    const c = await ctx.db.get(id);
    return mapCustomer(c!);
  },
});

export const update = mutation({
  args: {
    id: v.id("customers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    status: v.optional(v.string()),
    creditLimit: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...patch }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { ...patch, updatedAt: ts() });
    const c = await ctx.db.get(id);
    return mapCustomer(c!);
  },
});

export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.delete(id);
  },
});

export const searchCustomers = query({
  args: { query: v.string() },
  handler: async (ctx, { query: q }) => {
    await requireStaff(ctx);
    const rows = await filteredCustomers(ctx, q);
    return rows.slice(0, 50).map(mapCustomer);
  },
});

export const topCustomers = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("customers").order("desc").take(20);
    return rows.map(mapCustomer);
  },
});

export const outstandingBalances = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("customers").collect();
    return rows
      .filter((c) => (c.outstandingBalance ?? 0) > 0)
      .map((c) => ({
        customerId: c._id,
        name: c.name,
        balance: c.outstandingBalance ?? 0,
      }));
  },
});

export const outstandingBalanceCustomers = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("customers").collect();
    return rows
      .filter((c) => (c.outstandingBalance ?? 0) > 0)
      .map((c) => ({
        id: c._id,
        name: c.name,
        outstandingBalance: c.outstandingBalance ?? 0,
        email: c.email,
      }));
  },
});

export const customerSales = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, { customerId }) => {
    await requireStaff(ctx);
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .collect();
    return sales;
  },
});

export const customerStats = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, { customerId }) => {
    await requireStaff(ctx);
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .collect();
    const totalOrders = sales.length;
    const totalSpent = sales.reduce((a, s) => a + s.totalAmount, 0);
    return { totalOrders, totalSpent, lastOrderDate: sales[0]?.orderDate };
  },
});

export const updateCreditLimit = mutation({
  args: {
    id: v.id("customers"),
    creditLimit: v.number(),
  },
  handler: async (ctx, { id, creditLimit }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { creditLimit, updatedAt: ts() });
    const c = await ctx.db.get(id);
    return mapCustomer(c!);
  },
});
