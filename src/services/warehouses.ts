import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

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

/**
 * Get all warehouses
 */
export async function getWarehouses(): Promise<Warehouse[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.warehouses);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
}

/**
 * Get warehouse by ID
 */
export async function getWarehouse(id: string): Promise<Warehouse> {
  try {
    const response = await authFetch(API_ENDPOINTS.warehouseById(id));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    throw error;
  }
}

/**
 * Create a new warehouse
 */
export async function createWarehouse(payload: CreateWarehousePayload): Promise<Warehouse> {
  try {
    const response = await authFetch(API_ENDPOINTS.warehouses, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating warehouse:', error);
    throw error;
  }
}

/**
 * Update warehouse
 */
export async function updateWarehouse(id: string, payload: UpdateWarehousePayload): Promise<Warehouse> {
  try {
    const response = await authFetch(API_ENDPOINTS.warehouseById(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating warehouse:', error);
    throw error;
  }
}

/**
 * Delete warehouse
 */
export async function deleteWarehouse(id: string): Promise<void> {
  try {
    await authFetch(API_ENDPOINTS.warehouseById(id), {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    throw error;
  }
}
