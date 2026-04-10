import { getConvexClient, api } from "@/lib/convexClient";
import type { Doc } from "../../convex/_generated/dataModel";
import type { Id } from "../../convex/_generated/dataModel";

export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  method: string;
  status: "pending" | "completed" | "failed" | "refunded";
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayment {
  saleId: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  senderName?: string;
  transactionReference?: string;
  chequeNumber?: string;
  accountName?: string;
}

export interface UpdatePaymentStatus {
  status: "pending" | "completed" | "failed" | "refunded";
  notes?: string;
}

export interface PaymentRefund {
  amount: number;
  reason: string;
  notes?: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  refundedPayments: number;
  averagePaymentAmount: number;
}

function mapPayment(p: Doc<"payments">): Payment {
  const st = String(p.status).toLowerCase();
  const status =
    st === "completed" || st === "pending" || st === "failed" || st === "refunded"
      ? (st as Payment["status"])
      : "pending";
  return {
    id: String(p._id),
    saleId: p.saleId ? String(p.saleId) : "",
    amount: p.amount,
    method: p.method ?? "",
    status,
    reference: p.reference,
    notes: undefined,
    createdAt: new Date(p.createdAt).toISOString(),
    updatedAt: new Date(p.updatedAt).toISOString(),
  };
}

export async function getPayments(params: {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}): Promise<Payment[]> {
  const rows = await getConvexClient().query(api.payments.list, {
    page: params.page,
    limit: params.limit,
    status: params.status,
    method: params.method,
  });
  let list = rows.map(mapPayment);
  if (params.dateFrom) {
    list = list.filter((p) => p.createdAt >= params.dateFrom!);
  }
  if (params.dateTo) {
    list = list.filter((p) => p.createdAt <= params.dateTo! + "T23:59:59");
  }
  return list;
}

export async function getPaymentById(id: string): Promise<Payment> {
  const doc = await getConvexClient().query(api.payments.get, { id: id as Id<"payments"> });
  return mapPayment(doc);
}

export async function createPayment(paymentData: CreatePayment): Promise<Payment> {
  const paymentId = await getConvexClient().mutation(api.payments.create, {
    saleId: paymentData.saleId as Id<"sales">,
    amount: paymentData.amount,
    method: paymentData.method,
    status: "pending",
    reference: paymentData.reference ?? paymentData.transactionReference,
    paymentDate: new Date().toISOString(),
  });
  const doc = await getConvexClient().query(api.payments.get, {
    id: paymentId as Id<"payments">,
  });
  return mapPayment(doc!);
}

export async function updatePaymentStatus(id: string, statusData: UpdatePaymentStatus): Promise<Payment> {
  const doc = await getConvexClient().mutation(api.payments.updateStatus, {
    id: id as Id<"payments">,
    status: statusData.status,
  });
  return mapPayment(doc!);
}

export async function getPaymentsBySale(saleId: string): Promise<Payment[]> {
  const rows = await getConvexClient().query(api.payments.bySale, {
    saleId: saleId as Id<"sales">,
  });
  return rows.map(mapPayment);
}

export async function getPaymentsByMethod(method: string): Promise<Payment[]> {
  return getPayments({ method });
}

export async function getPaymentsByStatus(status: string): Promise<Payment[]> {
  return getPayments({ status });
}

export async function getPaymentsByDateRange(dateFrom: string, dateTo: string): Promise<Payment[]> {
  return getPayments({ dateFrom, dateTo });
}

export async function getPaymentByReference(reference: string): Promise<Payment> {
  const doc = await getConvexClient().query(api.payments.byReference, { reference });
  if (!doc) {
    throw new Error("Payment not found");
  }
  return mapPayment(doc);
}

export async function getDailyPayments(date: string): Promise<Payment[]> {
  const rows = await getConvexClient().query(api.payments.list, {});
  return rows
    .map(mapPayment)
    .filter((p) => p.createdAt.startsWith(date.slice(0, 10)));
}

export async function getPendingPayments(): Promise<Payment[]> {
  const rows = await getConvexClient().query(api.payments.pending, {});
  return rows.map(mapPayment);
}

export async function getPaymentStats(): Promise<PaymentStats> {
  const raw = await getConvexClient().query(api.payments.stats, {});
  const count = (raw as { count?: number }).count ?? 0;
  const totalAmount = (raw as { totalAmount?: number }).totalAmount ?? 0;
  const rows = await getConvexClient().query(api.payments.list, {});
  const mapped = rows.map(mapPayment);
  return {
    totalPayments: count,
    totalAmount,
    pendingPayments: mapped.filter((p) => p.status === "pending").length,
    completedPayments: mapped.filter((p) => p.status === "completed").length,
    failedPayments: mapped.filter((p) => p.status === "failed").length,
    refundedPayments: mapped.filter((p) => p.status === "refunded").length,
    averagePaymentAmount: count ? totalAmount / count : 0,
  };
}

export async function processPaymentRefund(id: string, _refundData: PaymentRefund): Promise<Payment> {
  const doc = await getConvexClient().mutation(api.payments.refund, {
    id: id as Id<"payments">,
  });
  return mapPayment(doc!);
}
