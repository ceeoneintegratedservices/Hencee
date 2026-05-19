import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

function ts() {
  return Date.now();
}

function formatWarehouseName(ref: string): string {
  const cleaned = ref.replace(/[_-]+/g, " ").trim();
  if (!cleaned) return "Warehouse";
  if (/^warehouse\b/i.test(cleaned)) {
    return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const titled = cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  return titled.toLowerCase().startsWith("warehouse") ? titled : `Warehouse ${titled}`;
}

export type WarehouseResolver = {
  resolve: (ref: string) => Promise<Id<"warehouses">>;
  createdCount: number;
};

/** Resolve warehouseId from CSV: Convex _id, existing code, or auto-create by code. */
export async function createWarehouseResolver(
  ctx: MutationCtx
): Promise<WarehouseResolver> {
  const cache = new Map<string, Id<"warehouses">>();
  const existing = await ctx.db.query("warehouses").collect();
  for (const w of existing) {
    cache.set(String(w._id).toLowerCase(), w._id);
    if (w.code?.trim()) {
      cache.set(w.code.trim().toLowerCase(), w._id);
    }
  }

  let createdCount = 0;

  const resolve = async (ref: string): Promise<Id<"warehouses">> => {
    const key = ref.trim();
    if (!key) {
      throw new Error("warehouseId is required");
    }
    const cached = cache.get(key.toLowerCase());
    if (cached) return cached;

    try {
      const doc = await ctx.db.get(key as Id<"warehouses">);
      if (doc) {
        cache.set(key.toLowerCase(), doc._id);
        return doc._id;
      }
    } catch {
      // Not a valid Convex id — treat as warehouse code
    }

    const t = ts();
    const id = await ctx.db.insert("warehouses", {
      name: formatWarehouseName(key),
      code: key,
      isActive: true,
      createdAt: t,
      updatedAt: t,
    });
    createdCount += 1;
    cache.set(key.toLowerCase(), id);
    return id;
  };

  return { resolve, get createdCount() { return createdCount; } };
}
