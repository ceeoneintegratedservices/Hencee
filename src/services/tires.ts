import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

export interface Tire {
  id?: string;
  name: string;
  description?: string;
  sku: string;
  categoryId: string;
  warehouseId?: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  brand: string;
  coverImage?: string;
  additionalImages?: { url: string }[];
  status?: 'PUBLISHED' | 'DRAFT';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTirePayload {
  name: string;
  description?: string;
  sku: string;
  categoryId?: string; // Optional for existing categories
  categoryName?: string; // For new category creation
  warehouseId?: string; // Optional for existing warehouses
  warehouseName?: string; // For new warehouse creation
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  brand: string;
  coverImage?: string;
  additionalImages?: { url: string }[];
  status?: 'PUBLISHED' | 'DRAFT';
}

export interface TireListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brand?: string;
}

export interface TireListResponse {
  data: Tire[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Fetch a list of tires with optional filtering and pagination
 */
export async function listTires(params: TireListParams = {}): Promise<TireListResponse> {
  const qp = new URLSearchParams();
  if (params.page != null) qp.set("page", String(params.page));
  if (params.limit != null) qp.set("limit", String(params.limit));
  if (params.search) qp.set("search", params.search);
  if (params.categoryId) qp.set("categoryId", params.categoryId);
  if (params.brand) qp.set("brand", params.brand);
  
  try {
    const url = `${API_ENDPOINTS.tires}${qp.toString() ? `?${qp.toString()}` : ""}`;
    const res = await authFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch tires list (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error listing tires:", error);
    throw error;
  }
}

/**
 * Fetch a single tire by ID
 */
export async function getTire(id: string): Promise<Tire> {
  try {
    const url = `${API_ENDPOINTS.tires}/${encodeURIComponent(id)}`;
    const res = await authFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch tire (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Error fetching tire ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new tire
 */
export async function createTire(body: CreateTirePayload): Promise<Tire> {
  try {
    const res = await authFetch(API_ENDPOINTS.tires, { 
      method: "POST", 
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body) 
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create tire (${res.status})`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error creating tire:", error);
    throw error;
  }
}

/**
 * Update an existing tire
 */
export async function updateTire(id: string, body: Partial<Tire>): Promise<Tire> {
  try {
    const url = `${API_ENDPOINTS.tires}/${encodeURIComponent(id)}`;
    const res = await authFetch(url, { 
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body) 
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update tire (${res.status})`);
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Error updating tire ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a tire
 */
export async function deleteTire(id: string): Promise<void> {
  try {
    const url = `${API_ENDPOINTS.tires}/${encodeURIComponent(id)}`;
    const res = await authFetch(url, { 
      method: "DELETE"
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete tire (${res.status})`);
    }
  } catch (error) {
    console.error(`Error deleting tire ${id}:`, error);
    throw error;
  }
}
