import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStaff } from "./lib/auth";

function ts() {
  return Date.now();
}

export const list = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    department: v.optional(v.string()),
    priority: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    let rows = await ctx.db.query("expenses").order("desc").collect();
    if (args.status) {
      const s = args.status.toLowerCase();
      rows = rows.filter(
        (r) => (r.status ?? "").toLowerCase() === s
      );
    }
    if (args.category) {
      rows = rows.filter((r) => r.category === args.category);
    }
    if (args.department) {
      rows = rows.filter((r) => r.department === args.department);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q)
      );
    }
    if (args.priority) {
      rows = rows.filter((r) => {
        const meta = r.metadata as { priority?: string } | undefined;
        return (meta?.priority ?? "").toLowerCase() === args.priority!.toLowerCase();
      });
    }
    if (args.startDate) {
      rows = rows.filter(
        (r) => (r.expenseDate ?? "") >= args.startDate!
      );
    }
    if (args.endDate) {
      rows = rows.filter(
        (r) => (r.expenseDate ?? "") <= args.endDate!
      );
    }
    const total = rows.length;
    const limit = Math.min(args.limit ?? 50, 200);
    const page = Math.max(args.page ?? 1, 1);
    const start = (page - 1) * limit;
    const slice = rows.slice(start, start + limit);
    return {
      expenses: slice,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },
});

export const get = query({
  args: { id: v.id("expenses") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    const e = await ctx.db.get(id);
    if (!e) {
      throw new Error("Not found");
    }
    return e;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    department: v.optional(v.string()),
    description: v.optional(v.string()),
    expenseDate: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const t = ts();
    return ctx.db.insert("expenses", {
      title: args.title,
      amount: args.amount,
      category: args.category,
      department: args.department,
      description: args.description,
      expenseDate: args.expenseDate,
      metadata: args.metadata,
      status: "pending",
      createdAt: t,
      updatedAt: t,
    });
  },
});

export const update = mutation({
  args: { id: v.id("expenses"), patch: v.any() },
  handler: async (ctx, { id, patch }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { ...(patch as object), updatedAt: ts() });
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.delete(id);
  },
});

export const expenseCategories = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return [{ id: "general", name: "General" }];
  },
});

export const expenseDepartments = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return [{ id: "ops", name: "Operations" }];
  },
});
