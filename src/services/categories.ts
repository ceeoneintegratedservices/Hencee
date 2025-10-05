import { authFetch } from './authFetch';

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

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const response = await authFetch('/categories');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Get all warehouses
 */
export async function getWarehouses(): Promise<Warehouse[]> {
  try {
    const response = await authFetch('/warehouses');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
}
