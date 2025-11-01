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

// Expense Approval Types (existing, enhanced)
export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID'
}

export interface ExpenseApproval {
  id: string;
  userId: string;
  title: string;
  amount: number;
  description?: string;
  category: string;
  status: ExpenseStatus;
  department?: string;
  priority?: string;
  vendor?: string;
  invoiceNumber?: string;
  tags?: string[];
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    staffRole: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    email: string;
    staffRole: string;
  };
}

// Account Approval Types
export enum AccountApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface AccountApproval {
  id: string;
  email: string;
  name: string;
  phone?: string;
  roleName: string;
  approvalStatus: AccountApprovalStatus;
  approvalRequestedAt?: string;
  approvalDecidedAt?: string;
  approvedByName?: string;
  approvalRejectionReason?: string;
  createdAt: string;
}

// Refund Request Types
export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed'
}

export interface RefundRequest {
  id: string;
  saleId: string;
  requestedById: string;
  requesterName?: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  approvedById?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  processedAt?: string;
  refundMethod?: string;
  refundReference?: string;
  createdAt: string;
  updatedAt: string;
}

// Paginated Response Type
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
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

// ============================================
// ACCOUNT APPROVALS API Functions
// ============================================

export async function getAccountApprovals(
  page: number = 1,
  limit: number = 10,
  status?: AccountApprovalStatus
): Promise<PaginatedResponse<AccountApproval>> {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) queryParams.set('status', status);

    const response = await authFetch(`${API_ENDPOINTS.accountApprovals}?${queryParams}`);
    const data = await response.json();
    
    // Handle both paginated response and array response
    if (data.items && data.total !== undefined) {
      return data as PaginatedResponse<AccountApproval>;
    }
    return {
      items: Array.isArray(data) ? data : (data.data || []),
      total: data.total || (Array.isArray(data) ? data.length : 0),
      page: data.page || page,
      limit: data.limit || limit,
    };
  } catch (error) {
    console.error('Error fetching account approvals:', error);
    throw error;
  }
}

export async function getPendingAccounts(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<AccountApproval>> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.accountApprovalsPending}?page=${page}&limit=${limit}`);
    const data = await response.json();
    
    if (data.items && data.total !== undefined) {
      return data as PaginatedResponse<AccountApproval>;
    }
    return {
      items: Array.isArray(data) ? data : (data.data || []),
      total: data.total || (Array.isArray(data) ? data.length : 0),
      page: data.page || page,
      limit: data.limit || limit,
    };
  } catch (error) {
    console.error('Error fetching pending accounts:', error);
    throw error;
  }
}

export async function approveAccount(userId: string): Promise<AccountApproval> {
  try {
    const response = await authFetch(API_ENDPOINTS.accountApprovalApprove(userId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to approve account');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error approving account:', error);
    throw error;
  }
}

export async function rejectAccount(userId: string, reason: string): Promise<AccountApproval> {
  try {
    const response = await authFetch(API_ENDPOINTS.accountApprovalReject(userId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, reason }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reject account');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error rejecting account:', error);
    throw error;
  }
}

// ============================================
// REFUND REQUEST APPROVALS API Functions
// ============================================

export async function createRefundRequest(data: {
  saleId: string;
  amount: number;
  reason: string;
}): Promise<RefundRequest> {
  try {
    const response = await authFetch(API_ENDPOINTS.refundApprovals, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create refund request');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating refund request:', error);
    throw error;
  }
}

export async function getRefundRequests(
  page: number = 1,
  limit: number = 10,
  status?: RefundStatus
): Promise<PaginatedResponse<RefundRequest>> {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) queryParams.set('status', status);

    const response = await authFetch(`${API_ENDPOINTS.refundApprovals}?${queryParams}`);
    const result = await response.json();
    
    if (result.items && result.total !== undefined) {
      return result as PaginatedResponse<RefundRequest>;
    }
    return {
      items: Array.isArray(result) ? result : (result.data || []),
      total: result.total || (Array.isArray(result) ? result.length : 0),
      page: result.page || page,
      limit: result.limit || limit,
    };
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    throw error;
  }
}

export async function getPendingRefunds(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<RefundRequest>> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.refundApprovalsPending}?page=${page}&limit=${limit}`);
    const data = await response.json();
    
    if (data.items && data.total !== undefined) {
      return data as PaginatedResponse<RefundRequest>;
    }
    return {
      items: Array.isArray(data) ? data : (data.data || []),
      total: data.total || (Array.isArray(data) ? data.length : 0),
      page: data.page || page,
      limit: data.limit || limit,
    };
  } catch (error) {
    console.error('Error fetching pending refunds:', error);
    throw error;
  }
}

export async function getRefundRequestById(id: string): Promise<RefundRequest> {
  try {
    const response = await authFetch(API_ENDPOINTS.refundApprovalById(id));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching refund request:', error);
    throw error;
  }
}

export async function approveRefund(
  id: string,
  refundMethod?: string,
  refundReference?: string
): Promise<RefundRequest> {
  try {
    const response = await authFetch(API_ENDPOINTS.refundApprovalApprove(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refundMethod, refundReference }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to approve refund');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error approving refund:', error);
    throw error;
  }
}

export async function rejectRefund(id: string, reason: string): Promise<RefundRequest> {
  try {
    const response = await authFetch(API_ENDPOINTS.refundApprovalReject(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reject refund');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error rejecting refund:', error);
    throw error;
  }
}

export async function markRefundAsProcessed(id: string): Promise<RefundRequest> {
  try {
    const response = await authFetch(API_ENDPOINTS.refundApprovalMarkProcessed(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to mark refund as processed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking refund as processed:', error);
    throw error;
  }
}

// Helper function to get pending counts for all approval types
export async function getPendingCounts(): Promise<{
  expenses: number;
  accounts: number;
  refunds: number;
  total: number;
}> {
  try {
    const [expenses, accounts, refunds] = await Promise.all([
      getPendingApprovals().catch(() => []),
      getPendingAccounts(1, 1).catch(() => ({ total: 0 })),
      getPendingRefunds(1, 1).catch(() => ({ total: 0 })),
    ]);

    const expensesTotal = Array.isArray(expenses) ? expenses.length : 0;
    const accountsTotal = 'total' in accounts ? accounts.total : 0;
    const refundsTotal = 'total' in refunds ? refunds.total : 0;

    return {
      expenses: expensesTotal,
      accounts: accountsTotal,
      refunds: refundsTotal,
      total: expensesTotal + accountsTotal + refundsTotal,
    };
  } catch (error) {
    console.error('Failed to get pending counts', error);
    return { expenses: 0, accounts: 0, refunds: 0, total: 0 };
  }
}