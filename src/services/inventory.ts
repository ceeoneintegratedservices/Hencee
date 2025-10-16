import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

// Types for Inventory API
export interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  reorderLevel: number;
  description?: string;
  sku?: string;
  barcode?: string;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
  createdAt: string;
  userId: string;
}

export interface CreateInventoryProduct {
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  reorderLevel: number;
  description?: string;
  sku?: string;
  barcode?: string;
  supplier?: string;
}

export interface UpdateInventoryProduct {
  name?: string;
  category?: string;
  price?: number;
  costPrice?: number;
  stock?: number;
  reorderLevel?: number;
  description?: string;
  sku?: string;
  barcode?: string;
  supplier?: string;
}

export interface StockAdjustment {
  quantity: number;
  reason: string;
  reference?: string;
}

export interface PurchaseHistoryItem {
  id: string;
  date: string;
  price: number;
  quantity: number;
  totalAmount: number;
  status: "COMPLETED" | "PENDING" | "CANCELLED" | "RETURNED";
  orderType: string;
  customerName: string;
  customerPhone: string;
  saleReference: string;
}

export interface PurchaseHistoryResponse {
  productId: string;
  productName: string;
  totalPurchases: number;
  totalQuantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  purchases: PurchaseHistoryItem[];
}

// Inventory API Functions
export async function getInventoryProducts(): Promise<InventoryProduct[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.inventory);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching inventory products:', error);
    throw error;
  }
}

export async function getInventoryProductById(id: string): Promise<InventoryProduct> {
  try {
    const response = await authFetch(API_ENDPOINTS.inventoryById(id));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching inventory product:', error);
    throw error;
  }
}

export async function createInventoryProduct(productData: CreateInventoryProduct): Promise<InventoryProduct> {
  try {
    const response = await authFetch(API_ENDPOINTS.inventory, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create inventory product');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating inventory product:', error);
    throw error;
  }
}

export async function updateInventoryProduct(id: string, productData: UpdateInventoryProduct): Promise<InventoryProduct> {
  try {
    const response = await authFetch(API_ENDPOINTS.inventoryById(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update inventory product');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating inventory product:', error);
    throw error;
  }
}

export async function deleteInventoryProduct(id: string): Promise<void> {
  try {
    const response = await authFetch(API_ENDPOINTS.inventoryById(id), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete inventory product');
    }
  } catch (error) {
    console.error('Error deleting inventory product:', error);
    throw error;
  }
}

export async function adjustProductStock(id: string, adjustment: StockAdjustment): Promise<InventoryProduct> {
  try {
    const response = await authFetch(API_ENDPOINTS.inventoryAdjustStock(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adjustment),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to adjust product stock');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adjusting product stock:', error);
    throw error;
  }
}

export async function getProductMovements(id: string): Promise<InventoryMovement[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.inventoryMovements(id));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product movements:', error);
    throw error;
  }
}

export async function setReorderLevel(id: string, reorderLevel: number): Promise<InventoryProduct> {
  try {
    const response = await authFetch(API_ENDPOINTS.inventoryReorderLevel(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reorderLevel }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to set reorder level');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error setting reorder level:', error);
    throw error;
  }
}

export async function getInventoryPermissions(): Promise<any> {
  try {
    const response = await authFetch(API_ENDPOINTS.inventoryPermissions);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching inventory permissions:', error);
    throw error;
  }
}

export async function getProductPurchaseHistory(id: string, limit: number = 20): Promise<PurchaseHistoryResponse> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.inventoryById(id)}/purchase-history?limit=${limit}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product purchase history:', error);
    throw error;
  }
}
