import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

export async function listPayments(params: { page?: number; limit?: number; saleId?: string } = {}) {
  const qp = new URLSearchParams();
  if (params.page != null) qp.set("page", String(params.page));
  if (params.limit != null) qp.set("limit", String(params.limit));
  if (params.saleId) qp.set("saleId", params.saleId);
  const res = await authFetch(`${API_ENDPOINTS.payments}${qp.toString() ? `?${qp.toString()}` : ""}`);
  if (!res.ok) throw new Error(`Failed to fetch payments (${res.status})`);
  return res.json();
}

export async function processPayment(body: { saleId: string; amount: number; method: "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE_MONEY" }) {
  const res = await authFetch(API_ENDPOINTS.payments, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Failed to process payment (${res.status})`);
  return res.json();
}

export async function listPaymentsByStatus(status: string, params: { page?: number; limit?: number } = {}) {
  const qp = new URLSearchParams();
  if (params.page != null) qp.set("page", String(params.page));
  if (params.limit != null) qp.set("limit", String(params.limit));
  const res = await authFetch(`${API_ENDPOINTS.payments}/status/${encodeURIComponent(status)}${qp.toString() ? `?${qp.toString()}` : ""}`);
  if (!res.ok) throw new Error(`Failed to fetch payments by status (${res.status})`);
  return res.json();
}

export async function listPaymentsInDateRange(params: { startDate: string; endDate: string; page?: number; limit?: number }) {
  const qp = new URLSearchParams();
  qp.set("startDate", params.startDate);
  qp.set("endDate", params.endDate);
  if (params.page != null) qp.set("page", String(params.page));
  if (params.limit != null) qp.set("limit", String(params.limit));
  const res = await authFetch(`${API_ENDPOINTS.payments}/date-range?${qp.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch payments by date range (${res.status})`);
  return res.json();
}

export async function getPaymentsStats(params: { startDate: string; endDate: string }) {
  const qp = new URLSearchParams();
  qp.set("startDate", params.startDate);
  qp.set("endDate", params.endDate);
  const res = await authFetch(`${API_ENDPOINTS.payments}/stats?${qp.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch payments stats (${res.status})`);
  return res.json();
}
