import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

export interface Approval {
  id: string;
  type: string;
  requestedBy: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  details: any;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  reason?: string;
}

export interface ApprovalsListResponse {
  data: Approval[];
  total: number;
  page: number;
  limit: number;
}

export interface ApprovalParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  type?: string;
}

/**
 * Fetch list of approvals with optional filtering
 */
export async function listApprovals(params: ApprovalParams = {}): Promise<ApprovalsListResponse> {
  try {
    const qp = new URLSearchParams();
    if (params.page != null) qp.set("page", String(params.page));
    if (params.limit != null) qp.set("limit", String(params.limit));
    if (params.status) qp.set("status", params.status);
    if (params.type) qp.set("type", params.type);
    
    const url = `${API_ENDPOINTS.approvals}${qp.toString() ? `?${qp.toString()}` : ""}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Approve a pending approval request
 */
export async function approveRequest(id: string, reason?: string): Promise<Approval> {
  try {
    const url = `${API_ENDPOINTS.approvals}/${id}/approve`;
    const res = await authFetch(url, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Reject a pending approval request
 */
export async function rejectRequest(id: string, reason: string): Promise<Approval> {
  try {
    const url = `${API_ENDPOINTS.approvals}/${id}/reject`;
    const res = await authFetch(url, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}
