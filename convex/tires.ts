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
    categoryId: v.optional(v.string()),
    brand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    let rows = await ctx.db.query("tires").order("desc").collect();
    if (args.brand) {
      rows = rows.filter(
        (r) => (r.brand ?? "").toLowerCase() === args.brand!.toLowerCase()
      );
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(s) ||
          (r.sku ?? "").toLowerCase().includes(s)
      );
    }
    if (args.categoryId) {
      rows = rows.filter((r) => {
        const m = r.metadata as { categoryId?: string } | undefined;
        return m?.categoryId === args.categoryId;
      });
    }
    const total = rows.length;
    const limit = Math.min(args.limit ?? 50, 200);
    const page = Math.max(args.page ?? 1, 1);
    const start = (page - 1) * limit;
    const data = rows.slice(start, start + limit);
    return { data, total, page, limit };
  },
});

export const get = query({
  args: { id: v.id("tires") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    const t = await ctx.db.get(id);
    if (!t) {
      throw new Error("Not found");
    }
    return t;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    sku: v.optional(v.string()),
    brand: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const t = ts();
    return ctx.db.insert("tires", {
      name: args.name,
      sku: args.sku,
      brand: args.brand,
      metadata: args.metadata,
      status: "active",
      createdAt: t,
      updatedAt: t,
    });
  },
});

export const update = mutation({
  args: { id: v.id("tires"), patch: v.any() },
  handler: async (ctx, { id, patch }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { ...(patch as object), updatedAt: ts() });
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("tires") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.delete(id);
  },
});
