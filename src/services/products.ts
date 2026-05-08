import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";

/** Convex `products.list` returns inventory rows (array). */
export async function listProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  /** Only return PUBLISHED items — always true when called from order forms */
  publishedOnly?: boolean;
} = {}): Promise<Record<string, unknown>[]> {
  const rows = await getConvexClient().query(api.products.list, {
    page: params.page,
    limit: params.limit,
    search: params.search,
    publishedOnly: params.publishedOnly,
  });
  return (rows as { _id?: string; id?: string }[]).map((r) => ({
    ...(() => {
      const row = r as Record<string, unknown>;
      const inventoryUnits =
        (row.inventoryUnits as
          | {
              piecesInStock?: number;
              cartonsInStock?: number;
              rollsInStock?: number;
              dozensInStock?: number;
            }
          | undefined) ?? {};
      const pieces = Number(inventoryUnits.piecesInStock ?? row.quantity ?? 0);
      const cartons = Number(inventoryUnits.cartonsInStock ?? 0);
      const rolls = Number(inventoryUnits.rollsInStock ?? 0);
      const dozens = Number(inventoryUnits.dozensInStock ?? 0);
      const piecesPerCarton = Number(row.piecesPerCarton ?? 0);
      const piecesPerRoll = Number(row.piecesPerRoll ?? 0);
      const piecesPerDozen = Number(row.piecesPerDozen ?? 12);
      const normalizedStock =
        pieces +
        cartons * piecesPerCarton +
        rolls * piecesPerRoll +
        dozens * piecesPerDozen;
      return {
        ...row,
        inventoryUnits,
        // Keep both fields for legacy consumers (order page/customer portal)
        stock: normalizedStock,
        quantity: normalizedStock,
      };
    })(),
    id: String(r.id ?? r._id ?? ""),
  }));
}

export async function getProduct(id: string) {
  return getConvexClient().query(api.products.get, { id: id as Id<"inventoryItems"> });
}

export async function createProduct(body: Record<string, unknown>) {
  return getConvexClient().mutation(api.products.create, { body });
}

export async function updateProduct(id: string, body: Record<string, unknown>) {
  return getConvexClient().mutation(api.products.update, {
    id: id as Id<"inventoryItems">,
    body,
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await getConvexClient().mutation(api.products.remove, { id: id as Id<"inventoryItems"> });
}

export async function searchProducts(query: string): Promise<unknown[]> {
  return getConvexClient().query(api.products.searchProducts, { query });
}

export async function getLowStockProducts(): Promise<unknown[]> {
  return getConvexClient().query(api.products.lowStock, {});
}

export async function updateProductStock(id: string, stock: number): Promise<unknown> {
  return getConvexClient().mutation(api.products.update, {
    id: id as Id<"inventoryItems">,
    body: { inventoryUnits: { piecesInStock: stock } },
  });
}

export async function getProductsByCategory(categoryId: string): Promise<unknown[]> {
  const rows = await listProducts({});
  return (rows as { categoryId?: string }[]).filter((r) => r.categoryId === categoryId);
}

export async function getProductsByWarehouse(warehouseId: string): Promise<unknown[]> {
  const rows = await listProducts({});
  return (rows as { warehouseId?: string }[]).filter((r) => r.warehouseId === warehouseId);
}
