import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  isActive: boolean;
  isEmailVerified: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
    description: string;
    roleType: string;
    permissions: string[];
  };
}

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
  name: string;
  phone: string;
  password: string;
  roleId: string;
  isEmailVerified?: boolean; // Optional: defaults to true for admin-created users
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
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
 * Assign a role to a user (backend: PUT /users/:id/role)
 */
export async function assignUserRole(userId: string, roleId: string): Promise<User> {
  try {
    const url = `${API_ENDPOINTS.users}/${encodeURIComponent(userId)}/role`;
    const res = await authFetch(url, {
      method: "PUT",
      body: JSON.stringify({ roleId })
    });
    
    // Check if response is OK before parsing
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = `Failed to assign role: ${res.status} ${res.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    return data;
  } catch (error: any) {
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(error?.message || 'Failed to assign role to user');
  }
}

/**
 * Activate a user (backend: PUT /users/:id/activate)
 */
export async function activateUser(userId: string): Promise<User> {
  try {
    const url = `${API_ENDPOINTS.users}/${encodeURIComponent(userId)}/activate`;
    const res = await authFetch(url, { method: "PUT" });
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Deactivate a user (backend: PUT /users/:id/deactivate)
 */
export async function deactivateUser(userId: string): Promise<User> {
  try {
    const url = `${API_ENDPOINTS.users}/${encodeURIComponent(userId)}/deactivate`;
    const res = await authFetch(url, { method: "PUT" });
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

/**
 * Verify a user's email (admin endpoint)
 */
export async function verifyUserEmail(userId: string): Promise<User> {
  try {
    const url = API_ENDPOINTS.userVerifyEmail(userId);
    const res = await authFetch(url, {
      method: "POST"
    });
    const data = await res.json();
    // Backend may return { message, user } or just the user object
    return data.user || data;
  } catch (error) {
    throw error;
  }
}
