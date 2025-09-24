import { API_BASE_URL } from "../config/api";
import { authFetch } from "./authFetch";

export async function getPermissionsMatrix() {
  const res = await authFetch(`${API_BASE_URL}/permissions/matrix`);
  if (!res.ok) throw new Error(`Failed to fetch permissions matrix (${res.status})`);
  return res.json();
}

export async function getRoles() {
  const res = await authFetch(`${API_BASE_URL}/permissions/roles`);
  if (!res.ok) throw new Error(`Failed to fetch roles (${res.status})`);
  return res.json();
}

export async function getUserPermissions(userId: string) {
  const res = await authFetch(`${API_BASE_URL}/permissions/user-permissions/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`Failed to fetch user permissions (${res.status})`);
  return res.json();
}

export async function deactivateUser(userId: string) {
  const res = await authFetch(`${API_BASE_URL}/auth/users/${encodeURIComponent(userId)}/deactivate`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to deactivate user (${res.status})`);
  return res.json();
}

export async function deleteUser(userId: string) {
  const res = await authFetch(`${API_BASE_URL}/auth/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete user (${res.status})`);
  return res.json();
}
