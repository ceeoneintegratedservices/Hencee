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

// Pharma-specific Inventory Types
export interface ExpiringProduct {
  id: string;
  name: string;
  sku: string;
  expiryDate: string;
  expiryWarehouse: string;
  expiryWarehouseName: string;
  daysUntilExpiry: number;
  quantity: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  isCritical: boolean;
}

export interface ExpiringProductsResponse {
  products: ExpiringProduct[];
  total: number;
  critical: number;
  warning: number;
  page: number;
  limit: number;
}

export interface ExpiringProductsParams {
  days?: number;
  warehouseId?: string;
  includeExpired?: boolean;
  page?: number;
  limit?: number;
}

export interface ProductDamage {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  inspectionDate: string;
  action: 'discard' | 'return' | 'repair';
  inspectorNotes?: string;
  warehouseId?: string;
  warehouseName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDamagePayload {
  quantity: number;
  reason: string;
  inspectionDate: string;
  action: 'discard' | 'return' | 'repair';
  inspectorNotes?: string;
  warehouseId?: string;
}

export interface DamageListParams {
  productId?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface DamageListResponse {
  damages: ProductDamage[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Get expiring products (Pharma-specific)
 */
export async function getExpiringProducts(params: ExpiringProductsParams = {}): Promise<ExpiringProductsResponse> {
  try {
    const qp = new URLSearchParams();
    if (params.days != null) qp.set('days', String(params.days));
    if (params.warehouseId) qp.set('warehouseId', params.warehouseId);
    if (params.includeExpired != null) qp.set('includeExpired', String(params.includeExpired));
    if (params.page != null) qp.set('page', String(params.page));
    if (params.limit != null) qp.set('limit', String(params.limit));

    const url = `${API_ENDPOINTS.inventoryExpiring}${qp.toString() ? `?${qp.toString()}` : ''}`;
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching expiring products:', error);
    throw error;
  }
}

/**
 * Get expiring products by warehouse (Pharma-specific)
 */
export async function getExpiringProductsByWarehouse(warehouseId: string, days: number = 30): Promise<ExpiringProductsResponse> {
  try {
    const url = `${API_ENDPOINTS.inventoryExpiringByWarehouse(warehouseId)}?days=${days}`;
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching expiring products by warehouse:', error);
    throw error;
  }
}

/**
 * Get all product damages (Pharma-specific)
 */
export async function getProductDamages(params: DamageListParams = {}): Promise<DamageListResponse> {
  try {
    const qp = new URLSearchParams();
    if (params.productId) qp.set('productId', params.productId);
    if (params.warehouseId) qp.set('warehouseId', params.warehouseId);
    if (params.startDate) qp.set('startDate', params.startDate);
    if (params.endDate) qp.set('endDate', params.endDate);
    if (params.page != null) qp.set('page', String(params.page));
    if (params.limit != null) qp.set('limit', String(params.limit));

    const url = `${API_ENDPOINTS.inventoryDamages}${qp.toString() ? `?${qp.toString()}` : ''}`;
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product damages:', error);
    throw error;
  }
}

/**
 * Get damage history for a specific product (Pharma-specific)
 */
export async function getProductDamageHistory(productId: string): Promise<ProductDamage[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.inventoryDamagesByProduct(productId));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product damage history:', error);
    throw error;
  }
}

/**
 * Record product damage (Pharma-specific)
 */
export async function recordProductDamage(productId: string, damageData: CreateDamagePayload): Promise<ProductDamage> {
  try {
    const response = await authFetch(API_ENDPOINTS.inventoryRecordDamage(productId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(damageData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to record product damage');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error recording product damage:', error);
    throw error;
  }
}
