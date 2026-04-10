import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getCategories(): Promise<Category[]> {
  return getConvexClient().query(api.categories.list, {});
}

export async function getCategoryById(id: string): Promise<Category> {
  return getConvexClient().query(api.categories.get, { id: id as Id<"categories"> });
}

export async function createCategory(categoryData: {
  name: string;
  description?: string;
}): Promise<Category> {
  const doc = await getConvexClient().mutation(api.categories.create, categoryData);
  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function updateCategory(
  id: string,
  categoryData: { name?: string; description?: string }
): Promise<Category> {
  const doc = await getConvexClient().mutation(api.categories.update, {
    id: id as Id<"categories">,
    ...categoryData,
  });
  if (!doc) {
    throw new Error("Category not found");
  }
  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function deleteCategory(id: string): Promise<void> {
  await getConvexClient().mutation(api.categories.remove, { id: id as Id<"categories"> });
}

export async function getWarehouses(): Promise<Warehouse[]> {
  const rows = await getConvexClient().query(api.warehouses.list, {});
  return rows.map((w) => ({
    id: w.id,
    name: w.name,
    location: w.address ?? "",
    description: undefined,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }));
}
