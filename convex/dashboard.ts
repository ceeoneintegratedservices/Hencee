import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireStaff } from "./lib/auth";

export const overview = query({
  args: { timeframe: v.optional(v.string()) },
  handler: async (ctx) => {
    await requireStaff(ctx);
    const customers = await ctx.db.query("customers").collect();
    const products = await ctx.db.query("inventoryItems").collect();
    const sales = await ctx.db.query("sales").collect();
    const profiles = await ctx.db.query("profiles").collect();
    return {
      sales: { sales: { value: sales.reduce((a, s) => a + s.totalAmount, 0), change: 0, volume: sales.length } },
      customers: {
        allCustomers: { value: customers.length, change: 0 },
        activeCustomers: { value: customers.length, change: 0 },
        inactiveCustomers: { value: 0, change: 0 },
        newCustomers: { value: 0, change: 0 },
        purchasingCustomers: { value: customers.length, change: 0 },
        abandonedCarts: { value: 0, change: 0 },
      },
      products: {
        allProducts: { value: products.length, change: 0 },
        active: { value: products.length, change: 0 },
      },
      orders: {
        allOrders: { value: sales.length, change: 0 },
        pending: {
          value: sales.filter((s) => String(s.status).toLowerCase().includes("pending")).length,
        },
        completed: { value: sales.filter((s) => String(s.status).toLowerCase().includes("complete")).length, change: 0 },
      },
      marketing: { acquisition: 0, purchase: 0, retention: 0 },
      volume: {
        volume: { value: sales.reduce((a, s) => a + s.totalAmount, 0) },
        receivables: { value: 0 },
        active: { value: sales.length },
      },
      users: {
        allUsers: { value: profiles.length, change: 0 },
        pending: { value: profiles.filter((p) => p.approvalStatus === "pending").length, change: 0 },
        approved: { value: profiles.filter((p) => p.approvalStatus === "approved").length, change: 0 },
        rejected: { value: profiles.filter((p) => p.approvalStatus === "rejected").length, change: 0 },
      },
    };
  },
});

export const salesSlice = query({
  args: { timeframe: v.optional(v.string()) },
  handler: async (ctx) => {
    await requireStaff(ctx);
    const sales = await ctx.db.query("sales").collect();
    return { sales: { value: sales.reduce((a, s) => a + s.totalAmount, 0), change: 0, count: sales.length } };
  },
});

export const customersSlice = query({
  args: { timeframe: v.optional(v.string()) },
  handler: async (ctx) => {
    await requireStaff(ctx);
    const customers = await ctx.db.query("customers").collect();
    return { total: customers.length, active: customers.length };
  },
});

export const productsSlice = query({
  args: { timeframe: v.optional(v.string()) },
  handler: async (ctx) => {
    await requireStaff(ctx);
    const products = await ctx.db.query("inventoryItems").collect();
    return { total: products.length };
  },
});

export const ordersSlice = query({
  args: { timeframe: v.optional(v.string()) },
  handler: async (ctx) => {
    await requireStaff(ctx);
    const sales = await ctx.db.query("sales").collect();
    return { total: sales.length };
  },
});

export const marketing = query({
  args: { timeframe: v.optional(v.string()) },
  handler: async (ctx) => {
    await requireStaff(ctx);
    return { acquisition: 0, purchase: 0, retention: 0 };
  },
});

export const volume = query({
  args: { timeframe: v.optional(v.string()) },
  handler: async (ctx) => {
    await requireStaff(ctx);
    return {
      volume: { value: 0 },
      receivables: { value: 0 },
      active: { value: 0 },
    };
  },
});

export const usersSlice = query({
  args: { timeframe: v.optional(v.string()) },
  handler: async (ctx) => {
    await requireStaff(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    return { total: profiles.length };
  },
});

function activityTypeFromResource(resource: string): string {
  const r = resource.toLowerCase();
  if (r.includes("sale") || r.includes("order")) return "order";
  if (r.includes("payment")) return "payment";
  if (r.includes("inventory") || r.includes("product")) return "inventory";
  if (r.includes("customer")) return "customer";
  if (r.includes("user") || r.includes("profile") || r.includes("auth")) return "user";
  if (r.includes("expense")) return "expense";
  if (r.includes("security") || r.includes("session")) return "security";
  return "other";
}

export const activities = query({
  args: {
    timeframe: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const limit = Math.min(args.limit ?? 50, 200);
    const logs = await ctx.db.query("auditLogs").order("desc").take(limit);
    const activities = logs.map((log) => {
      const ts = new Date(log.createdAt).toISOString();
      const desc =
        typeof log.details === "string"
          ? log.details
          : log.details != null
            ? JSON.stringify(log.details)
            : log.action;
      return {
        id: log._id,
        type: activityTypeFromResource(log.resource),
        action: log.action,
        description: desc,
        message: null as string | null,
        timestamp: ts,
        createdAt: ts,
        date: ts,
        entityId: log.resourceId ?? null,
        user: null as string | null,
        amount: null as number | null,
      };
    });
    return {
      activities,
      recentActivities: activities,
      message: null as string | null,
      description: null as string | null,
    };
  },
});

export const summary = query({
  args: { timeframe: v.optional(v.string()) },
  handler: async (ctx) => {
    await requireStaff(ctx);
    return { ok: true };
  },
});

/** Aggregates for overview: discounts on sales + damaged inventory value. */
export const lossMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const sales = await ctx.db.query("sales").collect();
    const products = await ctx.db.query("inventoryItems").collect();
    const damages = await ctx.db.query("inventoryDamages").collect();

    const productById = new Map(products.map((p) => [p._id, p]));

    let totalDiscounts = 0;
    for (const sale of sales) {
      const items = Array.isArray(sale.items) ? sale.items : [];
      for (const item of items) {
        const row = item as Record<string, unknown>;
        totalDiscounts += Number(row.discountAmount ?? 0);
      }
      const meta = (sale.metadata ?? {}) as Record<string, unknown>;
      totalDiscounts += Number(meta.discountTotal ?? 0);
    }

    let totalDamagedValue = 0;
    for (const d of damages) {
      const product = productById.get(d.productId);
      const cost = Number(product?.purchasePrice ?? product?.sellingPrice ?? 0);
      totalDamagedValue += cost * Number(d.quantity ?? 0);
    }

    return { totalDiscounts, totalDamagedValue, totalLoss: totalDiscounts + totalDamagedValue };
  },
});
