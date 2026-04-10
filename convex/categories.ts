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
    const rows = await ctx.db.query("categories").collect();
    return rows.map((c) => ({
      id: c._id,
      name: c.name,
      description: c.description,
      createdAt: new Date(c.createdAt).toISOString(),
      updatedAt: new Date(c.updatedAt).toISOString(),
    }));
  },
});

export const get = query({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    const c = await ctx.db.get(id);
    if (!c) {
      throw new Error("Not found");
    }
    return {
      id: c._id,
      name: c.name,
      description: c.description,
      createdAt: new Date(c.createdAt).toISOString(),
      updatedAt: new Date(c.updatedAt).toISOString(),
    };
  },
});

export const create = mutation({
  args: { name: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, { name, description }) => {
    await requireStaff(ctx);
    const t = ts();
    const id = await ctx.db.insert("categories", {
      name,
      description,
      createdAt: t,
      updatedAt: t,
    });
    return (await ctx.db.get(id))!;
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { ...patch, updatedAt: ts() });
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.delete(id);
  },
});
