import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  isActive: boolean;
  isEmailVerified: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
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
  isEmailVerified?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  roleId?: string;
  isActive?: boolean;
}

export async function listUsers(params: UserParams = {}): Promise<UsersListResponse> {
  return getConvexClient().query(api.users.listUsers, {
    page: params.page,
    limit: params.limit,
    search: params.search,
  });
}

export async function getUser(id: string): Promise<User> {
  return getConvexClient().query(api.users.getUser, { id: id as Id<"profiles"> });
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  return getConvexClient().mutation(api.users.createUser, {
    email: payload.email,
    name: payload.name,
    phone: payload.phone,
    roleId: payload.roleId,
  });
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  return getConvexClient().mutation(api.users.updateUser, {
    id: id as Id<"profiles">,
    name: payload.name,
    phone: payload.phone,
    isActive: payload.isActive,
  });
}

export async function assignUserRole(userId: string, roleId: string): Promise<User> {
  return getConvexClient().mutation(api.users.assignRole, {
    id: userId as Id<"profiles">,
    roleId,
  });
}

export async function activateUser(userId: string): Promise<User> {
  return getConvexClient().mutation(api.users.activateUser, { id: userId as Id<"profiles"> });
}

export async function deactivateUser(userId: string): Promise<User> {
  return getConvexClient().mutation(api.users.deactivateUser, { id: userId as Id<"profiles"> });
}

export async function deleteUser(id: string): Promise<void> {
  await getConvexClient().mutation(api.users.deleteUser, { id: id as Id<"profiles"> });
}

export async function verifyUserEmail(userId: string): Promise<User> {
  return getConvexClient().mutation(api.users.verifyEmail, { id: userId as Id<"profiles"> });
}
