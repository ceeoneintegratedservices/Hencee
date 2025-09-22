import { API_ENDPOINTS } from "../config/api";
import type { SalesDashboardQuery, SalesDashboardResponse, SaleDetail } from "../types/sales";
import { authFetch } from "./authFetch";

const cache = new Map<string, { t: number; data: SalesDashboardResponse }>();
const CACHE_TTL_MS = 15_000;

function buildQuery(params: SalesDashboardQuery): string {
  const qp = new URLSearchParams();
  if (params.page != null) qp.set("page", String(params.page));
  if (params.limit != null) qp.set("limit", String(params.limit));
  if (params.search) qp.set("search", params.search);
  if (params.status) qp.set("status", params.status);
  if (params.dateFrom) qp.set("dateFrom", params.dateFrom);
  if (params.dateTo) qp.set("dateTo", params.dateTo);
  if (params.sortBy) qp.set("sortBy", params.sortBy);
  if (params.sortDir) qp.set("sortDir", params.sortDir);
  const qs = qp.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchSalesDashboard(params: SalesDashboardQuery = {}): Promise<SalesDashboardResponse> {
  const url = `${API_ENDPOINTS.salesDashboard}${buildQuery(params)}`;
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && now - cached.t < CACHE_TTL_MS) {
    return cached.data;
  }
  const res = await authFetch(url, { next: { revalidate: 30 } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to fetch sales dashboard (${res.status})`);
  }
  const data = (await res.json()) as SalesDashboardResponse;
  cache.set(url, { t: now, data });
  return data;
}

export async function fetchSaleById(id: string): Promise<SaleDetail> {
  const url = `${API_ENDPOINTS.sales}/id/${encodeURIComponent(id)}`;
  const res = await authFetch(url, { next: { revalidate: 15 } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to fetch sale (${res.status})`);
  }
  const data = (await res.json()) as SaleDetail;
  return data;
}


