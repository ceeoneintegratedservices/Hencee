import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";

/** Convex `products.list` returns inventory rows (array). */
export async function listProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
} = {}): Promise<Record<string, unknown>[]> {
  const rows = await getConvexClient().query(api.products.list, {
    page: params.page,
    limit: params.limit,
    search: params.search,
  });
  return (rows as { _id?: string; id?: string }[]).map((r) => ({
    ...(r as Record<string, unknown>),
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
