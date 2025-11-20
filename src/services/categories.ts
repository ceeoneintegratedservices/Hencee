import { API_ENDPOINTS } from '../config/api';
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
 * Get all categories (Pharma/CeeOne)
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.categories);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Get category by ID (Pharma/CeeOne)
 */
export async function getCategoryById(id: string): Promise<Category> {
  try {
    const response = await authFetch(API_ENDPOINTS.categoryById(id));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
}

/**
 * Create category (Pharma/CeeOne)
 */
export async function createCategory(categoryData: { name: string; description?: string }): Promise<Category> {
  try {
    const response = await authFetch(API_ENDPOINTS.categories, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

/**
 * Update category (Pharma/CeeOne)
 */
export async function updateCategory(id: string, categoryData: { name?: string; description?: string }): Promise<Category> {
  try {
    const response = await authFetch(API_ENDPOINTS.categoryById(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Delete category (Pharma/CeeOne)
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    await authFetch(API_ENDPOINTS.categoryById(id), {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

/**
 * Get all warehouses (Pharma/CeeOne)
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
