import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";

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
  pricePerDozen?: number;
  piecesPerCarton?: number;
  piecesPerRoll?: number;
  piecesPerDozen?: number;
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
  categoryId?: string;
}

export type CreateInventoryProduct = BaseInventoryPayload;
export type UpdateInventoryProduct = Partial<BaseInventoryPayload>;

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: "PENDING" | "COMPLETED" | "RETURNED" | "DAMAGED" | "CANCELED";
  unitType?: string;
}

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
  items?: SaleItem[];
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
  warehousesCreated?: number;
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

export async function getInventoryProducts(
  params: InventoryListParams = {}
): Promise<InventoryListResponse> {
  return getConvexClient().query(api.inventory.list, {
    search: params.search,
    categoryId: params.categoryId as Id<"categories"> | undefined,
    warehouseId: params.warehouseId as Id<"warehouses"> | undefined,
    page: params.page,
    limit: params.limit,
  }) as Promise<InventoryListResponse>;
}

export async function getInventoryProductById(id: string): Promise<InventoryProduct> {
  const data = await getConvexClient().query(api.inventory.get, {
    id: id as Id<"inventoryItems">,
  });
  return data as InventoryProduct;
}

export async function createInventoryProduct(
  payload: CreateInventoryProduct
): Promise<InventoryProduct> {
  const data = await getConvexClient().mutation(api.inventory.create, {
    name: payload.name,
    sku: payload.sku,
    barcode: payload.barcode,
    description: payload.description,
    categoryName: payload.categoryName,
    warehouseId: payload.warehouseId as Id<"warehouses">,
    expiryWarehouseId: payload.expiryWarehouseId as Id<"warehouses"> | undefined,
    purchasePrice: payload.purchasePrice,
    sellingPrice: payload.sellingPrice,
    pricePerPiece: payload.pricePerPiece,
    pricePerCarton: payload.pricePerCarton,
    pricePerRoll: payload.pricePerRoll,
    pricePerDozen: payload.pricePerDozen,
    piecesPerCarton: payload.piecesPerCarton,
    piecesPerRoll: payload.piecesPerRoll,
    piecesPerDozen: payload.piecesPerDozen,
    inventoryUnits: payload.inventoryUnits,
    expiryDate: payload.expiryDate,
    productSize: payload.productSize,
    productSizeUnit: payload.productSizeUnit,
    packSize: payload.packSize,
    reorderPoint: payload.reorderPoint,
    isOutsourced: payload.isOutsourced,
    outsourcedDetails: payload.outsourcedDetails,
    expiryAlertThreshold: payload.expiryAlertThreshold,
    status: payload.status,
    metadata: payload.metadata,
    categoryId: payload.categoryId as Id<"categories"> | undefined,
  });
  return data as InventoryProduct;
}

export async function updateInventoryProduct(
  id: string,
  payload: UpdateInventoryProduct
): Promise<InventoryProduct> {
  const data = await getConvexClient().mutation(api.inventory.update, {
    id: id as Id<"inventoryItems">,
    patch: payload,
  });
  return data as InventoryProduct;
}

export async function deleteInventoryProduct(id: string): Promise<void> {
  await getConvexClient().mutation(api.inventory.remove, { id: id as Id<"inventoryItems"> });
}

export async function bulkPublishInventoryProducts(
  ids: string[],
  warehouseId?: string
): Promise<{ published: number }> {
  return getConvexClient().mutation(api.inventory.bulkPublish, {
    ids: ids as Id<"inventoryItems">[],
    warehouseId: warehouseId as Id<"warehouses"> | undefined,
  }) as Promise<{ published: number }>;
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
  
  const result = await getConvexClient().mutation(api.inventory.importProducts, {
    rows: cleanRows,
  });
  return result as InventoryImportResult;
}

export async function getInventoryExpiryAlerts(
  _threshold: number = 30
): Promise<InventoryProduct[]> {
  const data = await getConvexClient().query(api.inventory.expiryAlerts, {});
  return (data as InventoryProduct[]) ?? [];
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
  const data = await getConvexClient().query(api.inventory.expirySummary, {});
  const d = data as {
    total: number;
    expired: number;
    critical: number;
    warning: number;
    healthy: number;
  };
  return {
    totals: {
      total: d.total,
      expired: d.expired,
      critical: d.critical,
      warning: d.warning,
      healthy: d.healthy,
    },
    warehouses: [],
    upcoming: [],
  };
}

export async function listInventoryDamages(
  filters: InventoryDamageFilters = {}
): Promise<InventoryDamageResponse> {
  const rows = await getConvexClient().query(api.inventory.listDamages, {
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  const data: InventoryDamageRecord[] = (rows as Array<{
    _id: Id<"inventoryDamages">;
    productId: Id<"inventoryItems">;
    quantity: number;
    warehouseId?: Id<"warehouses">;
    reason: string;
    action: string;
    inspectorNotes?: string;
    createdAt: number;
  }>).map((d) => ({
    id: d._id,
    productId: d.productId,
    quantity: d.quantity,
    warehouseId: d.warehouseId,
    reason: d.reason,
    action: d.action,
    inspectorNotes: d.inspectorNotes,
    createdAt: new Date(d.createdAt).toISOString(),
  }));
  return {
    data,
    total: data.length,
    page: filters.page ?? 1,
    limit: filters.limit ?? data.length,
  };
}

export async function recordProductDamage(
  productId: string,
  payload: RecordDamagePayload
): Promise<InventoryProduct> {
  await getConvexClient().mutation(api.inventory.recordDamage, {
    productId: productId as Id<"inventoryItems">,
    quantity: payload.quantity,
    reason: payload.reason,
    warehouseId: payload.warehouseId as Id<"warehouses"> | undefined,
    action: payload.action,
    inspectorNotes: payload.inspectorNotes,
  });
  return getInventoryProductById(productId);
}

export async function getProductPurchaseHistory(
  id: string,
  _limit: number = 20,
  _filters?: { status?: string }
): Promise<PurchaseHistoryResponse> {
  return getConvexClient().query(api.inventory.purchaseHistory, {
    productId: id as Id<"inventoryItems">,
  });
}

// Utility helpers for CSV import ------------------------------------------------

/** Normalize header for lookup: trim, lowercase, strip spaces/underscores/dots/dashes */
function compactHeaderKey(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_.-]+/g, "");
}

/**
 * Map CSV column headers to canonical camelCase field names.
 * Accepts any common casing (expirydate, EXPIRY_DATE, expiryDate) and aliases (desc → description).
 */
const IMPORT_HEADER_ALIASES: Record<string, string> = {
  name: "name",
  sku: "sku",
  categoryname: "categoryName",
  category: "categoryName",
  warehouseid: "warehouseId",
  purchaseprice: "purchasePrice",
  sellingprice: "sellingPrice",
  expirydate: "expiryDate",
  expiry: "expiryDate",
  barcode: "barcode",
  description: "description",
  desc: "description",
  priceperpiece: "pricePerPiece",
  pricepercarton: "pricePerCarton",
  priceperroll: "pricePerRoll",
  priceperdozen: "pricePerDozen",
  piecespercarton: "piecesPerCarton",
  piecesperroll: "piecesPerRoll",
  piecesperdozen: "piecesPerDozen",
  piecesinstock: "piecesInStock",
  cartonsinstock: "cartonsInStock",
  cartoninstock: "cartonsInStock",
  rollsinstock: "rollsInStock",
  dozensinstock: "dozensInStock",
  productsize: "productSize",
  productsizeunit: "productSizeUnit",
  sizeunit: "productSizeUnit",
  packsize: "packSize",
  unitofsale: "packSize",
  packaging: "packSize",
  packtype: "packSize",
  dispensingunit: "packSize",
  salesunit: "packSize",
  reorderpoint: "reorderPoint",
  expiryalertthreshold: "expiryAlertThreshold",
  expirythreshold: "expiryAlertThreshold",
  isoutsourced: "isOutsourced",
  expirywarehouseid: "expiryWarehouseId",
  dosagestrength: "productSize",
  strength: "productSize",
  dosage: "productSize",
  concentration: "productSize",
  potency: "productSize",
};

export function normalizeImportHeader(header: string): string {
  const compact = compactHeaderKey(header);
  return IMPORT_HEADER_ALIASES[compact] ?? header.trim();
}

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
  let dozensInStockRaw: number | undefined;

  for (const [key, value] of Object.entries(record)) {
    // Skip if key is empty
    if (!key || key.trim() === '') continue;
    
    const mappedKey = normalizeImportHeader(key);
    
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
    } else if (mappedKey === "dozensInStock") {
      dozensInStockRaw = Number(coerced);
    } else if (mappedKey.includes(".")) {
      setNestedValue(payload, mappedKey, coerced);
    } else {
      payload[mappedKey] = coerced;
    }
  }

  // Support CSV rows that provide dozensInStock by converting to loose pieces.
  if (dozensInStockRaw !== undefined && !Number.isNaN(dozensInStockRaw) && dozensInStockRaw > 0) {
    const piecesPerDozen = Number(payload.piecesPerDozen ?? 12);
    const existingPieces = Number(payload.inventoryUnits?.piecesInStock ?? 0);
    setNestedValue(
      payload,
      "inventoryUnits.piecesInStock",
      existingPieces + dozensInStockRaw * piecesPerDozen
    );
  }

  return payload;
}
