import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

// Types for Approvals API
export interface ApprovalRequest {
  id: string;
  type: 'expense' | 'purchase' | 'refund' | 'other';
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requesterId: string;
  requesterName: string;
  approverId?: string;
  approverName?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidAt?: string;
  rejectionReason?: string;
  attachments?: string[];
}

export interface CreateApprovalRequest {
  type: 'expense' | 'purchase' | 'refund' | 'other';
  title: string;
  description: string;
  amount: number;
  currency: string;
  attachments?: string[];
}

export interface ApprovalAction {
  action: 'approve' | 'reject' | 'mark-paid';
  notes?: string;
  rejectionReason?: string;
}

export interface ApprovalStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  paidRequests: number;
  totalAmount: number;
  averageAmount: number;
}

// Approvals API Functions
export async function getApprovals(params: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  requesterId?: string;
} = {}): Promise<ApprovalRequest[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.status) queryParams.set('status', params.status);
    if (params.type) queryParams.set('type', params.type);
    if (params.requesterId) queryParams.set('requesterId', params.requesterId);

    const url = `${API_ENDPOINTS.approvals}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching approvals:', error);
    throw error;
  }
}

export async function getPendingApprovals(): Promise<ApprovalRequest[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.approvalsPending);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    throw error;
  }
}

export async function getApprovalById(id: string): Promise<ApprovalRequest> {
  try {
    const response = await authFetch(API_ENDPOINTS.approvalById(id));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching approval:', error);
    throw error;
  }
}

export async function createApprovalRequest(requestData: CreateApprovalRequest): Promise<ApprovalRequest> {
  try {
    const response = await authFetch(API_ENDPOINTS.approvals, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create approval request');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating approval request:', error);
    throw error;
  }
}

export async function approveRequest(id: string, actionData: ApprovalAction): Promise<ApprovalRequest> {
  try {
    const response = await authFetch(API_ENDPOINTS.approvalApprove(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(actionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to approve request');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error approving request:', error);
    throw error;
  }
}

export async function rejectRequest(id: string, actionData: ApprovalAction): Promise<ApprovalRequest> {
  try {
    const response = await authFetch(API_ENDPOINTS.approvalReject(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(actionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reject request');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error rejecting request:', error);
    throw error;
  }
}

export async function markRequestAsPaid(id: string, actionData: ApprovalAction): Promise<ApprovalRequest> {
  try {
    const response = await authFetch(API_ENDPOINTS.approvalMarkPaid(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(actionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to mark request as paid');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking request as paid:', error);
    throw error;
  }
}