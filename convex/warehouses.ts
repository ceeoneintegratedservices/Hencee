import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStaff } from "./lib/auth";

function ts() {
  return Date.now();
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("warehouses").collect();
    return rows.map((w) => ({
      id: w._id,
      name: w.name,
      code: w.code,
      address: w.address,
      isActive: w.isActive ?? true,
      createdAt: new Date(w.createdAt).toISOString(),
      updatedAt: new Date(w.updatedAt).toISOString(),
    }));
  },
});

export const get = query({
  args: { id: v.id("warehouses") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    const w = await ctx.db.get(id);
    if (!w) {
      throw new Error("Not found");
    }
    return {
      id: w._id,
      name: w.name,
      code: w.code,
      address: w.address,
      isActive: w.isActive ?? true,
      createdAt: new Date(w.createdAt).toISOString(),
      updatedAt: new Date(w.updatedAt).toISOString(),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const t = ts();
    const id = await ctx.db.insert("warehouses", {
      name: args.name,
      code: args.code,
      address: args.address,
      isActive: true,
      createdAt: t,
      updatedAt: t,
    });
    return (await ctx.db.get(id))!;
  },
});

export const update = mutation({
  args: {
    id: v.id("warehouses"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    address: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...patch }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { ...patch, updatedAt: ts() });
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("warehouses") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.delete(id);
  },
});

export const ensureDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("warehouses").first();
    if (existing) {
      return existing._id;
    }
    const t = ts();
    return ctx.db.insert("warehouses", {
      name: "Main Warehouse",
      code: "MAIN",
      isActive: true,
      createdAt: t,
      updatedAt: t,
    });
  },
});
