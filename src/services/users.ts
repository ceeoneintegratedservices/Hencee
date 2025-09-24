import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role?: {
    id: string;
    name: string;
    permissions: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  roleId?: string;
  isActive?: boolean;
}

/**
 * Fetch list of users with optional filtering
 */
export async function listUsers(params: UserParams = {}): Promise<UsersListResponse> {
  try {
    const qp = new URLSearchParams();
    if (params.page != null) qp.set("page", String(params.page));
    if (params.limit != null) qp.set("limit", String(params.limit));
    if (params.search) qp.set("search", params.search);
    if (params.roleId) qp.set("roleId", params.roleId);
    if (params.isActive !== undefined) qp.set("isActive", String(params.isActive));
    
    const url = `${API_ENDPOINTS.users}${qp.toString() ? `?${qp.toString()}` : ""}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get a specific user by ID
 */
export async function getUser(id: string): Promise<User> {
  try {
    const url = `${API_ENDPOINTS.users}/${encodeURIComponent(id)}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  try {
    const res = await authFetch(API_ENDPOINTS.users, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update an existing user
 */
export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  try {
    const url = `${API_ENDPOINTS.users}/${encodeURIComponent(id)}`;
    const res = await authFetch(url, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<void> {
  try {
    const url = `${API_ENDPOINTS.users}/${encodeURIComponent(id)}`;
    const res = await authFetch(url, {
      method: "DELETE"
    });
    if (res.status !== 204) {
      const data = await res.json();
      return data;
    }
  } catch (error) {
    throw error;
  }
}
