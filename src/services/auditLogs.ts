import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

/**
 * Fetch audit logs with optional filtering
 */
export async function getAuditLogs(params: AuditLogParams = {}): Promise<AuditLogsResponse> {
  try {
    const qp = new URLSearchParams();
    if (params.page != null) qp.set("page", String(params.page));
    if (params.limit != null) qp.set("limit", String(params.limit));
    if (params.userId) qp.set("userId", params.userId);
    if (params.action) qp.set("action", params.action);
    if (params.entityType) qp.set("entityType", params.entityType);
    if (params.entityId) qp.set("entityId", params.entityId);
    if (params.startDate) qp.set("startDate", params.startDate);
    if (params.endDate) qp.set("endDate", params.endDate);
    
    const url = `${API_ENDPOINTS.auditLogs}${qp.toString() ? `?${qp.toString()}` : ""}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}
