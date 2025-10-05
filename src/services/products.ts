import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

export async function listProducts(params: { page?: number; limit?: number; search?: string; category?: string } = {}) {
  const qp = new URLSearchParams();
  if (params.page != null) qp.set("page", String(params.page));
  if (params.limit != null) qp.set("limit", String(params.limit));
  if (params.search) qp.set("search", params.search);
  if (params.category) qp.set("category", params.category);
  try {
    const url = `${API_ENDPOINTS.products}${qp.toString() ? `?${qp.toString()}` : ""}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getProduct(id: string) {
  try {
    const url = `${API_ENDPOINTS.products}/${encodeURIComponent(id)}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function createProduct(body: any) {
  try {
    const res = await authFetch(API_ENDPOINTS.products, { 
      method: "POST", 
      body: JSON.stringify(body) 
    });
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function updateProduct(id: string, body: any) {
  try {
    const url = `${API_ENDPOINTS.products}/${encodeURIComponent(id)}`;
    const res = await authFetch(url, { 
      method: "PATCH", 
      body: JSON.stringify(body) 
    });
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const response = await authFetch(API_ENDPOINTS.productById(id), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

export async function searchProducts(query: string): Promise<any[]> {
  try {
    const queryParams = new URLSearchParams({ search: query });
    const url = `${API_ENDPOINTS.productSearch}?${queryParams.toString()}`;
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}

export async function getLowStockProducts(): Promise<any[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.productLowStock);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    throw error;
  }
}

export async function updateProductStock(id: string, stock: number): Promise<any> {
  try {
    const response = await authFetch(API_ENDPOINTS.productStock(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stock }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update product stock');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}

export async function getProductsByCategory(categoryId: string): Promise<any[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.productCategory(categoryId));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
}

export async function getProductsByWarehouse(warehouseId: string): Promise<any[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.productWarehouse(warehouseId));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products by warehouse:', error);
    throw error;
  }
}
