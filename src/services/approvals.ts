import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";

export interface ApprovalRequest {
  id: string;
  type: "expense" | "purchase" | "refund" | "other";
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected" | "paid";
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
  type: "expense" | "purchase" | "refund" | "other";
  title: string;
  description: string;
  amount: number;
  currency: string;
  attachments?: string[];
}

export interface ApprovalAction {
  action: "approve" | "reject" | "mark-paid";
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

export enum ExpenseStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
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

export enum AccountApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
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

export enum RefundStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  PROCESSED = "processed",
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
  type?: "refund" | "exchange";
  amountToPay?: number;
  creditAmount?: number;
  refundAmount?: number;
  amountLabel?: string;
  paymentProofUrl?: string;
  paymentMethod?: string;
  paymentReference?: string;
  bankAccountNumber?: string;
  bankName?: string;
  accountName?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

type ApprovalDoc = {
  _id: Id<"approvals">;
  type: string;
  status: string;
  title?: string;
  amount?: number;
  payload?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
};

function mapApprovalDoc(doc: ApprovalDoc): ApprovalRequest {
  const p = doc.payload ?? {};
  return {
    id: doc._id,
    type: (doc.type as ApprovalRequest["type"]) ?? "other",
    title: doc.title ?? "",
    description: typeof p.description === "string" ? p.description : "",
    amount: doc.amount ?? 0,
    currency: String(p.currency ?? "NGN"),
    status: doc.status as ApprovalRequest["status"],
    requesterId: String(p.requesterId ?? ""),
    requesterName: String(p.requesterName ?? ""),
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
    approvedAt: doc.status === "approved" && doc.resolvedAt
      ? new Date(doc.resolvedAt).toISOString()
      : undefined,
    rejectedAt: doc.status === "rejected" && doc.resolvedAt
      ? new Date(doc.resolvedAt).toISOString()
      : undefined,
    paidAt: doc.status === "paid" && doc.resolvedAt
      ? new Date(doc.resolvedAt).toISOString()
      : undefined,
    rejectionReason:
      typeof p.rejectionReason === "string" ? p.rejectionReason : undefined,
    attachments: Array.isArray(p.attachments)
      ? (p.attachments as string[])
      : undefined,
  };
}

type RefundDoc = {
  _id: Id<"refundRequests">;
  saleId?: Id<"sales">;
  status: string;
  amount?: number;
  reason?: string;
  payload?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

function mapRefundDoc(doc: RefundDoc): RefundRequest {
  const p = doc.payload ?? {};
  return {
    id: doc._id,
    saleId: doc.saleId ? String(doc.saleId) : "",
    requestedById: String(p.requestedById ?? ""),
    requesterName: p.requesterName as string | undefined,
    amount: doc.amount ?? 0,
    reason: doc.reason ?? "",
    status: doc.status as RefundStatus,
    refundMethod: p.refundMethod as string | undefined,
    refundReference: p.refundReference as string | undefined,
    rejectionReason: p.rejectionReason as string | undefined,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function getApprovals(params: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  requesterId?: string;
} = {}): Promise<ApprovalRequest[]> {
  const rows = await getConvexClient().query(api.approvals.list, {
    status: params.status,
    type: params.type,
  });
  let list = (rows as ApprovalDoc[]).map(mapApprovalDoc);
  if (params.requesterId) {
    list = list.filter((a) => a.requesterId === params.requesterId);
  }
  const page = params.page ?? 1;
  const limit = params.limit ?? 100;
  const start = (page - 1) * limit;
  return list.slice(start, start + limit);
}

export async function getPendingApprovals(): Promise<ApprovalRequest[]> {
  const rows = await getConvexClient().query(api.approvals.pending, {});
  return (rows as ApprovalDoc[]).map(mapApprovalDoc);
}

export async function getApprovalById(id: string): Promise<ApprovalRequest> {
  const doc = await getConvexClient().query(api.approvals.get, {
    id: id as Id<"approvals">,
  });
  return mapApprovalDoc(doc as ApprovalDoc);
}

export async function createApprovalRequest(
  requestData: CreateApprovalRequest
): Promise<ApprovalRequest> {
  const newId = await getConvexClient().mutation(api.approvals.create, {
    type: requestData.type,
    title: requestData.title,
    amount: requestData.amount,
    payload: {
      description: requestData.description,
      currency: requestData.currency,
      attachments: requestData.attachments,
    },
  });
  return getApprovalById(newId as string);
}

export async function approveRequest(
  id: string,
  actionData: ApprovalAction
): Promise<ApprovalRequest> {
  if (actionData.action === "approve") {
    await getConvexClient().mutation(api.approvals.approve, {
      id: id as Id<"approvals">,
    });
  } else if (actionData.action === "reject") {
    await getConvexClient().mutation(api.approvals.reject, {
      id: id as Id<"approvals">,
      reason: actionData.rejectionReason,
    });
  } else if (actionData.action === "mark-paid") {
    await getConvexClient().mutation(api.approvals.markPaid, {
      id: id as Id<"approvals">,
    });
  }
  return getApprovalById(id);
}

export async function rejectRequest(
  id: string,
  actionData: ApprovalAction
): Promise<ApprovalRequest> {
  await getConvexClient().mutation(api.approvals.reject, {
    id: id as Id<"approvals">,
    reason: actionData.rejectionReason ?? actionData.notes,
  });
  return getApprovalById(id);
}

export async function markRequestAsPaid(
  id: string,
  _actionData: ApprovalAction
): Promise<ApprovalRequest> {
  await getConvexClient().mutation(api.approvals.markPaid, {
    id: id as Id<"approvals">,
  });
  return getApprovalById(id);
}

export async function getAccountApprovals(
  page: number = 1,
  limit: number = 10,
  status?: AccountApprovalStatus
): Promise<PaginatedResponse<AccountApproval>> {
  const { users } = await getConvexClient().query(api.users.listUsers, {
    page: 1,
    limit: 500,
  });
  let items = users
    .filter((u) => !status || u.approvalStatus === status)
    .map(
      (u): AccountApproval => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        roleName: u.role.name,
        approvalStatus: (u.approvalStatus ??
          AccountApprovalStatus.PENDING) as AccountApprovalStatus,
        createdAt: u.createdAt,
      })
    );
  const start = (page - 1) * limit;
  const slice = items.slice(start, start + limit);
  return { items: slice, total: items.length, page, limit };
}

export async function getPendingAccounts(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<AccountApproval>> {
  return getAccountApprovals(page, limit, AccountApprovalStatus.PENDING);
}

export async function approveAccount(userId: string): Promise<AccountApproval> {
  await getConvexClient().mutation(api.approvals.approveAccount, {
    userId: userId as Id<"profiles">,
  });
  const u = await getConvexClient().query(api.users.getUser, {
    id: userId as Id<"profiles">,
  });
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    roleName: u.role.name,
    approvalStatus: AccountApprovalStatus.APPROVED,
    createdAt: u.createdAt,
  };
}

export async function rejectAccount(
  userId: string,
  reason: string
): Promise<AccountApproval> {
  await getConvexClient().mutation(api.approvals.rejectAccount, {
    userId: userId as Id<"profiles">,
    reason,
  });
  const u = await getConvexClient().query(api.users.getUser, {
    id: userId as Id<"profiles">,
  });
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    roleName: u.role.name,
    approvalStatus: AccountApprovalStatus.REJECTED,
    approvalRejectionReason: reason,
    createdAt: u.createdAt,
  };
}

export async function createRefundRequest(data: {
  saleId: string;
  amount: number;
  reason: string;
}): Promise<RefundRequest> {
  const doc = await getConvexClient().mutation(api.approvals.createRefund, {
    saleId: data.saleId as Id<"sales">,
    amount: data.amount,
    reason: data.reason,
  });
  return mapRefundDoc(doc as RefundDoc);
}

export async function getRefundRequests(
  page: number = 1,
  limit: number = 10,
  status?: RefundStatus
): Promise<PaginatedResponse<RefundRequest>> {
  const rows = await getConvexClient().query(api.approvals.refundList, {});
  let items = (rows as RefundDoc[]).map(mapRefundDoc);
  if (status) {
    items = items.filter((r) => r.status === status);
  }
  const total = items.length;
  const start = (page - 1) * limit;
  const slice = items.slice(start, start + limit);
  return { items: slice, total, page, limit };
}

export async function getPendingRefunds(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<RefundRequest>> {
  const rows = await getConvexClient().query(api.approvals.pendingRefunds, {});
  const items = (rows as RefundDoc[]).map(mapRefundDoc);
  const total = items.length;
  const start = (page - 1) * limit;
  const slice = items.slice(start, start + limit);
  return { items: slice, total, page, limit };
}

export async function getRefundRequestById(id: string): Promise<RefundRequest> {
  const doc = await getConvexClient().query(api.approvals.refundGet, {
    id: id as Id<"refundRequests">,
  });
  return mapRefundDoc(doc as RefundDoc);
}

export async function approveRefund(
  id: string,
  refundMethod?: string,
  refundReference?: string
): Promise<RefundRequest> {
  const doc = await getConvexClient().mutation(
    api.approvals.approveRefundRequest,
    {
      id: id as Id<"refundRequests">,
      refundMethod,
      refundReference,
    }
  );
  return mapRefundDoc(doc as RefundDoc);
}

export async function rejectRefund(
  id: string,
  reason: string
): Promise<RefundRequest> {
  const doc = await getConvexClient().mutation(
    api.approvals.rejectRefundRequest,
    {
      id: id as Id<"refundRequests">,
      reason,
    }
  );
  return mapRefundDoc(doc as RefundDoc);
}

export async function markRefundAsProcessed(id: string): Promise<RefundRequest> {
  const doc = await getConvexClient().mutation(
    api.approvals.markRefundProcessed,
    {
      id: id as Id<"refundRequests">,
    }
  );
  return mapRefundDoc(doc as RefundDoc);
}

export async function getPendingCounts(): Promise<{
  expenses: number;
  accounts: number;
  refunds: number;
  total: number;
}> {
  const c = await getConvexClient().query(api.approvals.pendingCounts, {});
  const expenses = c.expenses;
  const accounts = c.accounts;
  const refunds = c.refunds;
  return {
    expenses,
    accounts,
    refunds,
    total: expenses + accounts + refunds,
  };
}
