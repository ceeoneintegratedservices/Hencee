import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehousePayload {
  name: string;
  address: string;
  capacity: number;
  isActive?: boolean;
}

export interface UpdateWarehousePayload {
  name?: string;
  address?: string;
  capacity?: number;
  isActive?: boolean;
}

export interface WarehousesListResponse {
  warehouses: Warehouse[];
  total: number;
  page: number;
  limit: number;
}

function mapWarehouse(w: {
  id: string;
  name: string;
  address?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}): Warehouse {
  return {
    id: w.id,
    name: w.name,
    address: w.address ?? "",
    capacity: 0,
    isActive: w.isActive ?? true,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

export async function getWarehouses(): Promise<Warehouse[]> {
  const rows = await getConvexClient().query(api.warehouses.list, {});
  return rows.map(mapWarehouse);
}

export async function getWarehouse(id: string): Promise<Warehouse> {
  const w = await getConvexClient().query(api.warehouses.get, { id: id as Id<"warehouses"> });
  return mapWarehouse(w as Parameters<typeof mapWarehouse>[0]);
}

export async function createWarehouse(payload: CreateWarehousePayload): Promise<Warehouse> {
  const created = await getConvexClient().mutation(api.warehouses.create, {
    name: payload.name,
    address: payload.address,
    code: `WH-${Date.now()}`,
  });
  return mapWarehouse({
    id: String(created._id),
    name: created.name,
    address: created.address,
    isActive: created.isActive ?? true,
    createdAt: new Date(created.createdAt).toISOString(),
    updatedAt: new Date(created.updatedAt).toISOString(),
  });
}

export async function updateWarehouse(id: string, payload: UpdateWarehousePayload): Promise<Warehouse> {
  const updated = await getConvexClient().mutation(api.warehouses.update, {
    id: id as Id<"warehouses">,
    name: payload.name,
    address: payload.address,
    isActive: payload.isActive,
  });
  if (!updated) {
    throw new Error("Warehouse not found");
  }
  return mapWarehouse({
    id: String(updated._id),
    name: updated.name,
    address: updated.address,
    isActive: updated.isActive ?? true,
    createdAt: new Date(updated.createdAt).toISOString(),
    updatedAt: new Date(updated.updatedAt).toISOString(),
  });
}

export async function deleteWarehouse(id: string): Promise<void> {
  await getConvexClient().mutation(api.warehouses.remove, { id: id as Id<"warehouses"> });
}
