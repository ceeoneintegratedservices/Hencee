import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStaff } from "./lib/auth";

export const list = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    /** When true, only PUBLISHED items are returned (used by orders modal) */
    publishedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    let rows = await ctx.db.query("inventoryItems").collect();
    if (args.search) {
      const s = args.search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(s));
    }
    if (args.publishedOnly) {
      rows = rows.filter((r) => {
        const s = String(r.status ?? "PUBLISHED").toUpperCase();
        return s === "PUBLISHED";
      });
    }
    return rows;
  },
});

export const get = query({
  args: { id: v.id("inventoryItems") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    return ctx.db.get(id);
  },
});

export const create = mutation({
  args: { body: v.any() },
  handler: async (ctx, { body }) => {
    await requireStaff(ctx);
    const t = Date.now();
    const b = body as Record<string, unknown>;
    const dateStamp = new Date(t).toISOString().slice(0, 10).replace(/-/g, "");
    const rawSku = String(b.sku ?? "").trim();
    const sku = rawSku ? `${rawSku}-${dateStamp}` : `SKU-${dateStamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    return ctx.db.insert("inventoryItems", {
      name: String(b.name ?? "Product"),
      sku,
      categoryName: String(b.categoryName ?? "General"),
      warehouseId: b.warehouseId as import("./_generated/dataModel").Id<"warehouses">,
      purchasePrice: Number(b.purchasePrice ?? 0),
      sellingPrice: Number(b.sellingPrice ?? 0),
      expiryDate: String(b.expiryDate ?? new Date().toISOString()),
      status: "PUBLISHED",
      createdAt: t,
      updatedAt: t,
    });
  },
});

export const update = mutation({
  args: { id: v.id("inventoryItems"), body: v.any() },
  handler: async (ctx, { id, body }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { ...(body as object), updatedAt: Date.now() });
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("inventoryItems") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.delete(id);
  },
});

export const searchProducts = query({
  args: { query: v.string() },
  handler: async (ctx, { query: q }) => {
    await requireStaff(ctx);
    const s = q.toLowerCase();
    return (await ctx.db.query("inventoryItems").collect())
      .filter((r) => r.name.toLowerCase().includes(s))
      .slice(0, 50);
  },
});

export const lowStock = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return (await ctx.db.query("inventoryItems").collect()).filter((r) => {
      const units = r.inventoryUnits as { piecesInStock?: number } | undefined;
      return (units?.piecesInStock ?? 0) < (r.reorderPoint ?? 5);
    });
  },
});
