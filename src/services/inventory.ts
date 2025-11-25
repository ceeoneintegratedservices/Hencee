import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

const JSON_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

const NUMBER_FIELDS = new Set([
  "purchasePrice",
  "sellingPrice",
  "pricePerPiece",
  "pricePerCarton",
  "pricePerRoll",
  "piecesPerCarton",
  "piecesPerRoll",
  "inventoryUnits.piecesInStock",
  "inventoryUnits.cartonsInStock",
  "inventoryUnits.rollsInStock",
  "reorderPoint",
  "outsourcedDetails.sourceCostPrice",
  "outsourcedDetails.liveSellingPrice",
  "expiryAlertThreshold",
]);

export type InventoryStatus = "PUBLISHED" | "DRAFT" | "UNPUBLISHED";

export interface InventoryUnits {
  piecesInStock?: number;
  cartonsInStock?: number;
  rollsInStock?: number;
}

export interface OutsourcedDetails {
  supplierName?: string;
  sourceCostPrice?: number;
  liveSellingPrice?: number;
  notes?: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  category?: string;
  categoryName?: string;
  categoryId?: string;
  warehouse?: string;
  warehouseId?: string;
  expiryWarehouse?: string;
  expiryWarehouseId?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  pricePerPiece?: number;
  pricePerCarton?: number;
  pricePerRoll?: number;
  piecesPerCarton?: number;
  piecesPerRoll?: number;
  quantity?: number;
  inventoryUnits?: InventoryUnits;
  productSize?: string;
  productSizeUnit?: string;
  expiryDate?: string;
  expiryStatus?: "expired" | "critical" | "warning" | "healthy";
  reorderPoint?: number;
  expiryAlertThreshold?: number;
  isOutsourced?: boolean;
  outsourcedDetails?: OutsourcedDetails;
  metadata?: Record<string, any>;
  status?: InventoryStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryListParams {
  search?: string;
  categoryId?: string;
  warehouseId?: string;
  outsourcedOnly?: boolean;
  expiryStatus?: "expired" | "critical" | "warning" | "healthy";
  page?: number;
  limit?: number;
}

export interface InventoryListResponse {
  data: InventoryProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface InventoryUnitsPayload extends InventoryUnits {}

export interface BaseInventoryPayload {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryName: string;
  warehouseId: string;
  expiryWarehouseId?: string;
  purchasePrice: number;
  sellingPrice: number;
  pricePerPiece?: number;
  pricePerCarton?: number;
  pricePerRoll?: number;
  piecesPerCarton?: number;
  piecesPerRoll?: number;
  inventoryUnits?: InventoryUnitsPayload;
  expiryDate: string;
  productSize?: string;
  productSizeUnit?: string;
  reorderPoint?: number;
  isOutsourced?: boolean;
  outsourcedDetails?: OutsourcedDetails;
  expiryAlertThreshold?: number;
  status?: InventoryStatus;
  metadata?: Record<string, any>;
}

export type CreateInventoryProduct = BaseInventoryPayload;
export type UpdateInventoryProduct = Partial<BaseInventoryPayload>;

export interface PurchaseHistoryItem {
  id: string;
  date: string;
  price: number;
  quantity: number;
  totalAmount: number;
  status: "COMPLETED" | "PENDING" | "CANCELLED" | "RETURNED";
  orderType: string;
  customerName: string;
  customerPhone: string;
  saleReference: string;
}

export interface PurchaseHistoryResponse {
  productId: string;
  productName: string;
  totalPurchases: number;
  totalQuantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  purchases: PurchaseHistoryItem[];
}

export interface InventoryImportResult {
  total: number;
  created: number;
  failed: number;
  results: Array<{
    success: boolean;
    sku?: string;
    id?: string;
    message?: string;
  }>;
}

export interface RecordDamagePayload {
  quantity: number;
  reason: string;
  warehouseId?: string;
  action: "discard" | "return" | "repair";
  inspectorNotes?: string;
}

export interface InventoryDamageFilters {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  reason?: string;
  productId?: string;
  action?: "discard" | "return" | "repair";
  page?: number;
  limit?: number;
}

export interface InventoryDamageRecord {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  warehouseId?: string;
  warehouseName?: string;
  reason: string;
  action?: string;
  inspectorNotes?: string;
  recordedBy?: string;
  recordedByName?: string;
  createdAt: string;
  inspectionDate?: string;
}

export interface InventoryDamageSummary {
  totalDamages?: number;
  totalQuantity?: number;
  quantityByReason?: Record<string, number>;
  quantityByAction?: Record<string, number>;
}

export interface InventoryDamageResponse {
  data: InventoryDamageRecord[];
  summary?: InventoryDamageSummary;
  page?: number;
  limit?: number;
  total?: number;
}

function buildQuery(params: InventoryListParams): string {
  const qp = new URLSearchParams();
  if (params.search) qp.set("search", params.search);
  if (params.categoryId) qp.set("categoryId", params.categoryId);
  if (params.warehouseId) qp.set("warehouseId", params.warehouseId);
  if (params.outsourcedOnly) qp.set("outsourcedOnly", "true");
  if (params.expiryStatus) qp.set("expiryStatus", params.expiryStatus);
  if (params.page != null) qp.set("page", String(params.page));
  if (params.limit != null) qp.set("limit", String(params.limit));
  return qp.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const errorMessage = data?.message || data?.error || "Request failed";
    throw new Error(errorMessage);
  }
  return data as T;
}

export async function getInventoryProducts(
  params: InventoryListParams = {}
): Promise<InventoryListResponse> {
  const query = buildQuery(params);
  const url = query ? `${API_ENDPOINTS.inventory}?${query}` : API_ENDPOINTS.inventory;
  const response = await authFetch(url);
  const data = await parseResponse<any>(response);

  if (Array.isArray(data)) {
    return {
      data,
      total: data.length,
      page: params.page ?? 1,
      limit: params.limit ?? data.length,
    };
  }

  return {
    data: data?.data ?? [],
    total: data?.total ?? (data?.data?.length ?? 0),
    page: data?.page ?? params.page ?? 1,
    limit: data?.limit ?? params.limit ?? (data?.data?.length ?? 20),
  };
}

export async function getInventoryProductById(id: string): Promise<InventoryProduct> {
    const response = await authFetch(API_ENDPOINTS.inventoryById(id));
  return parseResponse<InventoryProduct>(response);
}

export async function createInventoryProduct(
  payload: CreateInventoryProduct
): Promise<InventoryProduct> {
    const response = await authFetch(API_ENDPOINTS.inventory, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  return parseResponse<InventoryProduct>(response);
}

export async function updateInventoryProduct(
  id: string,
  payload: UpdateInventoryProduct
): Promise<InventoryProduct> {
    const response = await authFetch(API_ENDPOINTS.inventoryById(id), {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  return parseResponse<InventoryProduct>(response);
}

export async function deleteInventoryProduct(id: string): Promise<void> {
    const response = await authFetch(API_ENDPOINTS.inventoryById(id), {
    method: "DELETE",
  });
  await parseResponse(response);
}

export async function importInventoryProducts(
  rows: CreateInventoryProduct[]
): Promise<InventoryImportResult> {
  const response = await authFetch(API_ENDPOINTS.inventoryImport, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ rows }),
  });
  return parseResponse<InventoryImportResult>(response);
}

export async function getInventoryExpiryAlerts(
  threshold: number = 30
): Promise<InventoryProduct[]> {
  const url = `${API_ENDPOINTS.inventoryExpiryAlerts}?threshold=${threshold}`;
  const response = await authFetch(url);
  const data = await parseResponse<any>(response);
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  return [];
}

export interface InventoryExpirySummaryTotals {
  healthy?: number;
  warning?: number;
  critical?: number;
  expired?: number;
  total?: number;
}

export interface InventoryExpiryWarehouseBreakdown
  extends InventoryExpirySummaryTotals {
  warehouseId?: string;
  warehouseName?: string;
}

export interface InventoryExpiryUpcomingEntry {
  productId?: string;
  productName?: string;
  sku?: string;
  expiryDate?: string;
  daysRemaining?: number;
  status?: InventoryProduct["expiryStatus"];
  warehouseName?: string;
  warehouseId?: string;
}

export interface InventoryExpirySummary {
  totals?: InventoryExpirySummaryTotals;
  warehouses?: InventoryExpiryWarehouseBreakdown[];
  upcoming?: InventoryExpiryUpcomingEntry[];
}

export async function getInventoryExpirySummary(): Promise<InventoryExpirySummary> {
  const response = await authFetch(API_ENDPOINTS.inventoryExpirySummary);
  const data = await parseResponse<any>(response);
  if (data && typeof data === "object") {
    return {
      totals: data.totals ?? data.summary ?? {},
      warehouses: Array.isArray(data.warehouses)
        ? data.warehouses
        : Array.isArray(data.breakdown)
        ? data.breakdown
        : [],
      upcoming: Array.isArray(data.upcoming) ? data.upcoming : [],
    };
  }
  return {};
}

export async function listInventoryDamages(
  filters: InventoryDamageFilters = {}
): Promise<InventoryDamageResponse> {
  const qp = new URLSearchParams();
  if (filters.startDate) qp.set("startDate", filters.startDate);
  if (filters.endDate) qp.set("endDate", filters.endDate);
  if (filters.warehouseId) qp.set("warehouseId", filters.warehouseId);
  if (filters.reason) qp.set("reason", filters.reason);
  if (filters.productId) qp.set("productId", filters.productId);
  if (filters.action) qp.set("action", filters.action);
  if (filters.page != null) qp.set("page", String(filters.page));
  if (filters.limit != null) qp.set("limit", String(filters.limit));
  const url = qp.toString()
    ? `${API_ENDPOINTS.inventoryDamages}?${qp.toString()}`
    : API_ENDPOINTS.inventoryDamages;
  const response = await authFetch(url);
  const data = await parseResponse<any>(response);
  if (Array.isArray(data)) {
    return { data, total: data.length, page: filters.page ?? 1, limit: filters.limit ?? data.length };
  }
  return {
    data: data?.data ?? [],
    summary: data?.summary,
    total: data?.total ?? data?.data?.length ?? 0,
    page: data?.page ?? filters.page ?? 1,
    limit: data?.limit ?? filters.limit ?? data?.data?.length ?? 20,
  };
}

export async function recordProductDamage(
  productId: string,
  payload: RecordDamagePayload
): Promise<InventoryProduct> {
  const response = await authFetch(API_ENDPOINTS.inventoryRecordDamage(productId), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  return parseResponse<InventoryProduct>(response);
}

export async function getProductPurchaseHistory(
  id: string,
  limit: number = 20
): Promise<PurchaseHistoryResponse> {
  const response = await authFetch(
    `${API_ENDPOINTS.inventoryById(id)}/purchase-history?limit=${limit}`
  );
  return parseResponse<PurchaseHistoryResponse>(response);
}

// Utility helpers for CSV import ------------------------------------------------
export function setNestedValue(target: Record<string, any>, path: string, value: any) {
  const segments = path.split(".");
  let current = target;

  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      current[segment] = value;
      return;
    }
    if (!current[segment]) {
      current[segment] = {};
    }
    current = current[segment];
  });
}

export function coerceValue(path: string, rawValue: string): any {
  if (rawValue === undefined || rawValue === null) return undefined;
  const trimmed = rawValue.trim();
  if (trimmed === "") return undefined;

  if (NUMBER_FIELDS.has(path)) {
    const numericValue = Number(trimmed);
    return isNaN(numericValue) ? undefined : numericValue;
  }

  if (path === "isOutsourced") {
    return ["true", "1", "yes"].includes(trimmed.toLowerCase());
  }

  return trimmed;
}

export function mapFlatRecordToPayload(
  record: Record<string, string>
): Partial<CreateInventoryProduct> {
  const payload: Record<string, any> = {};

  for (const [key, value] of Object.entries(record)) {
    const coerced = coerceValue(key, value);
    if (coerced === undefined) continue;
    if (key.includes(".")) {
      setNestedValue(payload, key, coerced);
    } else {
      payload[key] = coerced;
    }
  }

  return payload;
}
