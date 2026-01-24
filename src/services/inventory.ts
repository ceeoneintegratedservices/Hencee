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
  "piecesPerDozen", // Support for dozen
  "pricePerDozen", // Support for dozen
  "inventoryUnits.piecesInStock",
  "inventoryUnits.cartonsInStock",
  "inventoryUnits.rollsInStock",
  "piecesInStock", // Flat field mapping
  "cartonInStock", // Flat field mapping (will be mapped to cartonsInStock)
  "cartonsInStock", // Flat field mapping
  "rollsInStock", // Flat field mapping
  "dozensInStock", // Support for dozen (will be ignored if not supported)
  "reorderPoint",
  "outsourcedDetails.sourceCostPrice",
  "outsourcedDetails.liveSellingPrice",
  "expiryAlertThreshold",
  "productSize",
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
  image?: string; // Image URL for outsourced product evidence
  salePrice?: number; // Sale price when product is outsourced
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
  packSize?: string;
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
  pricePerDozen?: number;
  piecesPerCarton?: number;
  piecesPerRoll?: number;
  piecesPerDozen?: number;
  inventoryUnits?: InventoryUnitsPayload;
  expiryDate: string;
  productSize?: string;
  productSizeUnit?: string;
  packSize?: string;
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
  // Validate that rows is not empty
  if (!rows || rows.length === 0) {
    throw new Error('No rows to import. CSV parsing may have failed.');
  }
  
  // Validate each row before sending
  rows.forEach((row, idx) => {
    if (!row || typeof row !== 'object') {
      throw new Error(`Row ${idx + 1} is not a valid object: ${typeof row}`);
    }
    const keys = Object.keys(row);
    if (keys.length === 0) {
      throw new Error(`Row ${idx + 1} is empty (no keys). This should have been caught earlier.`);
    }
  });
  
  // Create a deep clone to ensure we're sending plain objects (no getters/setters/prototypes)
  const cleanRows = rows.map(row => {
    // Deep clone using JSON serialization to ensure plain objects
    return JSON.parse(JSON.stringify(row));
  });
  
  const requestBody = { rows: cleanRows };
  const requestBodyString = JSON.stringify(requestBody);
  
  // Verify the request body structure
  try {
    const verifyBody = JSON.parse(requestBodyString);
    
    // Final check - ensure first row has data
    if (verifyBody.rows?.[0] && Object.keys(verifyBody.rows[0]).length === 0) {
      throw new Error('Request body contains empty rows. This should not happen.');
    }
  } catch (e) {
    throw new Error('Request body verification failed');
  }
  
  const response = await authFetch(API_ENDPOINTS.inventoryImport, {
    method: "POST",
    headers: JSON_HEADERS,
    body: requestBodyString,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Failed to import inventory';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData?.message || errorData?.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  // Parse response manually to better handle errors
  const text = await response.text();
  let result: InventoryImportResult;
  
  try {
    result = text ? JSON.parse(text) : { total: 0, created: 0, failed: 0, results: [] };
  } catch (e) {
    throw new Error(`Invalid response from server: ${text.substring(0, 200)}`);
  }
  
  // Ensure results array has proper error messages
  if (result.results && Array.isArray(result.results)) {
    result.results = result.results.map((r: any) => {
      if (!r.success) {
        // Check if it's an empty object
        if (!r || Object.keys(r).length === 0) {
          return {
            ...r,
            success: false,
            message: 'Backend returned empty error object. This usually means the request payload was empty or malformed. Check that CSV data was parsed correctly.',
            error: 'Empty error response',
            raw: r,
          };
        }
        
        // Extract error message from various possible fields
        const errorMsg = r.message || 
                        r.error || 
                        r.errorMessage || 
                        r.details || 
                        (r.errors && Array.isArray(r.errors) ? r.errors.join(', ') : undefined) ||
                        (typeof r === 'string' ? r : undefined) ||
                        (r.data && typeof r.data === 'string' ? r.data : undefined) ||
                        (r.response && r.response.message ? r.response.message : undefined) ||
                        'Validation failed - check required fields';
        
        return {
          ...r,
          success: false,
          message: errorMsg,
          raw: r,
        };
      }
      return r;
    });
  }
  
  return result;
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
  try {
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
  } catch (error: any) {
    // Handle 403 Forbidden errors gracefully - return empty summary instead of throwing
    if (error?.status === 403 || error?.statusCode === 403 || error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
      return {};
    }
    // Re-throw other errors
    throw error;
  }
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

  // Field name aliases/mappings
  const fieldMappings: Record<string, string> = {
    "cartonInStock": "cartonsInStock", // Fix singular to plural
    "unitOfSale": "packSize",
    "packaging": "packSize",
    "packType": "packSize",
    "dispensingUnit": "packSize",
    "salesUnit": "packSize",
    "dosageStrength": "productSize", // Alternative name for productSize
    "strength": "productSize",
    "dosage": "productSize",
    "concentration": "productSize",
    "potency": "productSize",
  };

  for (const [key, value] of Object.entries(record)) {
    // Skip if key is empty
    if (!key || key.trim() === '') continue;
    
    // Apply field name mapping
    const mappedKey = fieldMappings[key] || key;
    
    // Skip unsupported fields
    if (mappedKey === "dozensInStock") {
      continue;
    }
    
    const coerced = coerceValue(mappedKey, value);
    
    // Only skip if coerced is explicitly undefined (not 0 or empty string for required fields)
    if (coerced === undefined) {
      continue;
    }
    
    // Map flat inventory unit fields to nested structure
    if (mappedKey === "piecesInStock") {
      setNestedValue(payload, "inventoryUnits.piecesInStock", coerced);
    } else if (mappedKey === "cartonsInStock" || mappedKey === "cartonInStock") {
      setNestedValue(payload, "inventoryUnits.cartonsInStock", coerced);
    } else if (mappedKey === "rollsInStock") {
      setNestedValue(payload, "inventoryUnits.rollsInStock", coerced);
    } else if (mappedKey.includes(".")) {
      setNestedValue(payload, mappedKey, coerced);
    } else {
      payload[mappedKey] = coerced;
    }
  }

  return payload;
}
