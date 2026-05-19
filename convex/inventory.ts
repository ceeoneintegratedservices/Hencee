import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStaff } from "./lib/auth";
import { createWarehouseResolver } from "./lib/resolveWarehouse";
import type { Doc, Id } from "./_generated/dataModel";

function ts() {
  return Date.now();
}

function normalizeExpiryDate(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined;
  const raw = input.trim();
  if (!raw) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

function mapProduct(doc: Doc<"inventoryItems">) {
  return {
    id: doc._id,
    name: doc.name,
    sku: doc.sku,
    barcode: doc.barcode,
    description: doc.description,
    category: doc.categoryName,
    categoryName: doc.categoryName,
    categoryId: doc.categoryId,
    warehouse: undefined,
    warehouseId: doc.warehouseId,
    expiryWarehouse: undefined,
    expiryWarehouseId: doc.expiryWarehouseId,
    purchasePrice: doc.purchasePrice,
    sellingPrice: doc.sellingPrice,
    pricePerPiece: doc.pricePerPiece,
    pricePerCarton: doc.pricePerCarton,
    pricePerRoll: doc.pricePerRoll,
    pricePerDozen: doc.pricePerDozen,
    piecesPerCarton: doc.piecesPerCarton,
    piecesPerRoll: doc.piecesPerRoll,
    piecesPerDozen: doc.piecesPerDozen,
    inventoryUnits: doc.inventoryUnits,
    productSize: doc.productSize,
    productSizeUnit: doc.productSizeUnit,
    packSize: doc.packSize,
    expiryDate: doc.expiryDate,
    reorderPoint: doc.reorderPoint,
    expiryAlertThreshold: doc.expiryAlertThreshold,
    isOutsourced: doc.isOutsourced,
    outsourcedDetails: doc.outsourcedDetails,
    status: doc.status,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export const list = query({
  args: {
    search: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    warehouseId: v.optional(v.id("warehouses")),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const limit = Math.min(args.limit ?? 50, 200);
    const page = Math.max(args.page ?? 1, 1);
    let rows = await ctx.db.query("inventoryItems").order("desc").collect();
    if (args.categoryId) {
      rows = rows.filter((r) => r.categoryId === args.categoryId);
    }
    if (args.warehouseId) {
      rows = rows.filter((r) => r.warehouseId === args.warehouseId);
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(s) || r.sku.toLowerCase().includes(s)
      );
    }
    const total = rows.length;
    const start = (page - 1) * limit;
    const data = rows.slice(start, start + limit).map(mapProduct);
    return { data, total, page, limit };
  },
});

export const get = query({
  args: { id: v.id("inventoryItems") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    const doc = await ctx.db.get(id);
    if (!doc) {
      throw new Error("Not found");
    }
    return mapProduct(doc);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    sku: v.string(),
    barcode: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryName: v.string(),
    warehouseId: v.id("warehouses"),
    expiryWarehouseId: v.optional(v.id("warehouses")),
    purchasePrice: v.number(),
    sellingPrice: v.number(),
    pricePerPiece: v.optional(v.number()),
    pricePerCarton: v.optional(v.number()),
    pricePerRoll: v.optional(v.number()),
    pricePerDozen: v.optional(v.number()),
    piecesPerCarton: v.optional(v.number()),
    piecesPerRoll: v.optional(v.number()),
    piecesPerDozen: v.optional(v.number()),
    inventoryUnits: v.optional(v.any()),
    expiryDate: v.string(),
    productSize: v.optional(v.string()),
    productSizeUnit: v.optional(v.string()),
    packSize: v.optional(v.string()),
    reorderPoint: v.optional(v.number()),
    isOutsourced: v.optional(v.boolean()),
    outsourcedDetails: v.optional(v.any()),
    expiryAlertThreshold: v.optional(v.number()),
    status: v.optional(v.string()),
    metadata: v.optional(v.any()),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const t = ts();
    const id = await ctx.db.insert("inventoryItems", {
      name: args.name,
      sku: args.sku,
      barcode: args.barcode,
      description: args.description,
      categoryName: args.categoryName,
      categoryId: args.categoryId,
      warehouseId: args.warehouseId,
      expiryWarehouseId: args.expiryWarehouseId,
      purchasePrice: args.purchasePrice,
      sellingPrice: args.sellingPrice,
      pricePerPiece: args.pricePerPiece,
      pricePerCarton: args.pricePerCarton,
      pricePerRoll: args.pricePerRoll,
      pricePerDozen: args.pricePerDozen,
      piecesPerCarton: args.piecesPerCarton,
      piecesPerRoll: args.piecesPerRoll,
      piecesPerDozen: args.piecesPerDozen,
      inventoryUnits: args.inventoryUnits,
      expiryDate: args.expiryDate,
      productSize: args.productSize,
      productSizeUnit: args.productSizeUnit,
      packSize: args.packSize,
      reorderPoint: args.reorderPoint,
      isOutsourced: args.isOutsourced,
      outsourcedDetails: args.outsourcedDetails,
      expiryAlertThreshold: args.expiryAlertThreshold,
      status: args.status ?? "PUBLISHED",
      metadata: args.metadata,
      createdAt: t,
      updatedAt: t,
    });
    return mapProduct((await ctx.db.get(id))!);
  },
});

export const update = mutation({
  args: {
    id: v.id("inventoryItems"),
    patch: v.any(),
  },
  handler: async (ctx, { id, patch }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { ...(patch as object), updatedAt: ts() });
    return mapProduct((await ctx.db.get(id))!);
  },
});

export const remove = mutation({
  args: { id: v.id("inventoryItems") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.delete(id);
  },
});

export const expirySummary = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("inventoryItems").collect();
    return {
      total: rows.length,
      expired: 0,
      critical: 0,
      warning: 0,
      healthy: rows.length,
    };
  },
});

export const expiryAlerts = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return [];
  },
});

export const listDamages = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx) => {
    await requireStaff(ctx);
    return await ctx.db.query("inventoryDamages").order("desc").collect();
  },
});

export const recordDamage = mutation({
  args: {
    productId: v.id("inventoryItems"),
    quantity: v.number(),
    reason: v.string(),
    warehouseId: v.optional(v.id("warehouses")),
    action: v.string(),
    inspectorNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    await ctx.db.insert("inventoryDamages", {
      productId: args.productId,
      quantity: args.quantity,
      reason: args.reason,
      warehouseId: args.warehouseId,
      action: args.action,
      inspectorNotes: args.inspectorNotes,
      createdAt: ts(),
    });
  },
});

export const importProducts = mutation({
  args: { rows: v.array(v.any()) },
  handler: async (ctx, { rows }) => {
    await requireStaff(ctx);
    let created = 0;
    const results: { success: boolean; sku?: string; id?: string; message?: string }[] = [];
    const t = ts();
    const warehouseResolver = await createWarehouseResolver(ctx);
    for (const row of rows) {
      try {
        const warehouseRef = String(row.warehouseId ?? "").trim();
        if (!warehouseRef) {
          throw new Error("warehouseId is required");
        }
        const warehouseId = await warehouseResolver.resolve(warehouseRef);
        let expiryWarehouseId: Id<"warehouses"> | undefined;
        const expiryRef = String(row.expiryWarehouseId ?? "").trim();
        if (expiryRef) {
          expiryWarehouseId = await warehouseResolver.resolve(expiryRef);
        }

        const dateStamp = new Date(t).toISOString().slice(0, 10).replace(/-/g, "");
        const rawSku = String(row.sku ?? "").trim();
        const sku = rawSku ? `${rawSku}-${dateStamp}` : `SKU-${dateStamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        const parsedExpiryDate = normalizeExpiryDate(row.expiryDate);
        const inventoryUnits = row.inventoryUnits ?? {
          piecesInStock: Number(row.piecesInStock ?? 0),
          cartonsInStock: Number(row.cartonsInStock ?? row.cartonInStock ?? 0),
          rollsInStock: Number(row.rollsInStock ?? 0),
        };
        const id = await ctx.db.insert("inventoryItems", {
          name: String(row.name ?? "Item"),
          sku,
          categoryName: String(row.categoryName ?? "General"),
          warehouseId,
          expiryWarehouseId,
          barcode: row.barcode ? String(row.barcode) : undefined,
          description: row.description ? String(row.description) : undefined,
          purchasePrice: Number(row.purchasePrice ?? 0),
          sellingPrice: Number(row.sellingPrice ?? 0),
          pricePerPiece: row.pricePerPiece !== undefined ? Number(row.pricePerPiece) : undefined,
          pricePerCarton: row.pricePerCarton !== undefined ? Number(row.pricePerCarton) : undefined,
          pricePerRoll: row.pricePerRoll !== undefined ? Number(row.pricePerRoll) : undefined,
          pricePerDozen: row.pricePerDozen !== undefined ? Number(row.pricePerDozen) : undefined,
          piecesPerCarton: row.piecesPerCarton !== undefined ? Number(row.piecesPerCarton) : undefined,
          piecesPerRoll: row.piecesPerRoll !== undefined ? Number(row.piecesPerRoll) : undefined,
          piecesPerDozen: row.piecesPerDozen !== undefined ? Number(row.piecesPerDozen) : undefined,
          inventoryUnits,
          productSize: row.productSize !== undefined ? String(row.productSize) : undefined,
          productSizeUnit: row.productSizeUnit !== undefined ? String(row.productSizeUnit) : undefined,
          packSize: row.packSize !== undefined ? String(row.packSize) : undefined,
          expiryDate: parsedExpiryDate ?? new Date().toISOString().slice(0, 10),
          reorderPoint: row.reorderPoint !== undefined ? Number(row.reorderPoint) : undefined,
          expiryAlertThreshold:
            row.expiryAlertThreshold !== undefined ? Number(row.expiryAlertThreshold) : undefined,
          isOutsourced: row.isOutsourced === true,
          outsourcedDetails: row.outsourcedDetails ?? undefined,
          // Bulk imports are always UNPUBLISHED until manually published to a warehouse
          status: "UNPUBLISHED",
          metadata: row.metadata ?? undefined,
          createdAt: t,
          updatedAt: t,
        });
        created++;
        results.push({ success: true, sku, id: id as string });
      } catch (e) {
        results.push({
          success: false,
          message: e instanceof Error ? e.message : "error",
        });
      }
    }
    return {
      total: rows.length,
      created,
      failed: rows.length - created,
      warehousesCreated: warehouseResolver.createdCount,
      results,
    };
  },
});

/** Publish a batch of UNPUBLISHED items to the given warehouse, making them available for orders. */
export const bulkPublish = mutation({
  args: {
    ids: v.array(v.id("inventoryItems")),
    warehouseId: v.optional(v.id("warehouses")),
  },
  handler: async (ctx, { ids, warehouseId }) => {
    await requireStaff(ctx);
    const t = ts();
    let published = 0;
    for (const id of ids) {
      const item = await ctx.db.get(id);
      if (!item) continue;
      const patch: Record<string, unknown> = { status: "PUBLISHED", updatedAt: t };
      if (warehouseId) patch.warehouseId = warehouseId;
      await ctx.db.patch(id, patch);
      published++;
    }
    return { published };
  },
});

export const purchaseHistory = query({
  args: { productId: v.id("inventoryItems") },
  handler: async (ctx, { productId }) => {
    await requireStaff(ctx);
    return {
      productId,
      productName: (await ctx.db.get(productId))?.name ?? "",
      totalPurchases: 0,
      totalQuantitySold: 0,
      totalRevenue: 0,
      averagePrice: 0,
      purchases: [],
    };
  },
});

/** Pharma: products with expiry on/before `days` from now (ISO expiryDate on inventory rows). */
export const listExpiringWithinDays = query({
  args: {
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { days = 90, limit = 200 }) => {
    await requireStaff(ctx);
    const horizon = Date.now() + Math.max(1, days) * 86400000;
    const rows = await ctx.db.query("inventoryItems").collect();
    const out: Array<
      ReturnType<typeof mapProduct> & { expiresAtMs: number; daysUntilExpiry: number }
    > = [];
    for (const r of rows) {
      if (!r.expiryDate) continue;
      const t = Date.parse(r.expiryDate);
      if (Number.isNaN(t)) continue;
      if (t > horizon) continue;
      const base = mapProduct(r);
      const daysUntil = Math.ceil((t - Date.now()) / 86400000);
      out.push({
        ...base,
        expiresAtMs: t,
        daysUntilExpiry: daysUntil,
      });
    }
    out.sort((a, b) => a.expiresAtMs - b.expiresAtMs);
    return out.slice(0, Math.min(limit, 500));
  },
});
