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
