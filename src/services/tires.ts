import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";

export interface Tire {
  id?: string;
  name: string;
  description?: string;
  sku: string;
  categoryId: string;
  warehouseId?: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  brand: string;
  coverImage?: string;
  additionalImages?: { url: string }[];
  status?: "PUBLISHED" | "DRAFT";
  createdAt?: string;
  updatedAt?: string;
}

type TireMeta = {
  description?: string;
  categoryId?: string;
  warehouseId?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  quantity?: number;
  coverImage?: string;
  additionalImages?: { url: string }[];
  status?: "PUBLISHED" | "DRAFT";
};

type TireDoc = {
  _id: Id<"tires">;
  name: string;
  sku?: string;
  brand?: string;
  metadata?: TireMeta;
  status?: string;
  createdAt: number;
  updatedAt: number;
};

function mapTire(doc: TireDoc): Tire {
  const m = doc.metadata ?? {};
  return {
    id: doc._id,
    name: doc.name,
    description: m.description,
    sku: doc.sku ?? "",
    categoryId: m.categoryId ?? "",
    warehouseId: m.warehouseId,
    purchasePrice: m.purchasePrice ?? 0,
    sellingPrice: m.sellingPrice ?? 0,
    quantity: m.quantity ?? 0,
    brand: doc.brand ?? "",
    coverImage: m.coverImage,
    additionalImages: m.additionalImages,
    status: m.status,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export interface CreateTirePayload {
  name: string;
  description?: string;
  sku: string;
  categoryId?: string;
  categoryName?: string;
  warehouseId?: string;
  warehouseName?: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  brand: string;
  coverImage?: string;
  additionalImages?: { url: string }[];
  status?: "PUBLISHED" | "DRAFT";
}

export interface TireListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brand?: string;
}

export interface TireListResponse {
  data: Tire[];
  total: number;
  page: number;
  limit: number;
}

export async function listTires(
  params: TireListParams = {}
): Promise<TireListResponse> {
  const raw = await getConvexClient().query(api.tires.list, {
    page: params.page,
    limit: params.limit,
    search: params.search,
    categoryId: params.categoryId,
    brand: params.brand,
  });
  return {
    data: (raw.data as TireDoc[]).map(mapTire),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
  };
}

export async function getTire(id: string): Promise<Tire> {
  const doc = await getConvexClient().query(api.tires.get, {
    id: id as Id<"tires">,
  });
  return mapTire(doc as TireDoc);
}

export async function createTire(body: CreateTirePayload): Promise<Tire> {
  const id = await getConvexClient().mutation(api.tires.create, {
    name: body.name,
    sku: body.sku,
    brand: body.brand,
    metadata: {
      description: body.description,
      categoryId: body.categoryId,
      categoryName: body.categoryName,
      warehouseId: body.warehouseId,
      warehouseName: body.warehouseName,
      purchasePrice: body.purchasePrice,
      sellingPrice: body.sellingPrice,
      quantity: body.quantity,
      coverImage: body.coverImage,
      additionalImages: body.additionalImages,
      status: body.status,
    },
  });
  return getTire(id as string);
}

export async function updateTire(id: string, body: Partial<Tire>): Promise<Tire> {
  const existing = await getConvexClient().query(api.tires.get, {
    id: id as Id<"tires">,
  });
  const prev = existing as TireDoc;
  const m = { ...(prev.metadata ?? {}) };
  if (body.description !== undefined) m.description = body.description;
  if (body.categoryId !== undefined) m.categoryId = body.categoryId;
  if (body.warehouseId !== undefined) m.warehouseId = body.warehouseId;
  if (body.purchasePrice !== undefined) m.purchasePrice = body.purchasePrice;
  if (body.sellingPrice !== undefined) m.sellingPrice = body.sellingPrice;
  if (body.quantity !== undefined) m.quantity = body.quantity;
  if (body.coverImage !== undefined) m.coverImage = body.coverImage;
  if (body.additionalImages !== undefined) m.additionalImages = body.additionalImages;
  if (body.status !== undefined) m.status = body.status;

  await getConvexClient().mutation(api.tires.update, {
    id: id as Id<"tires">,
    patch: {
      name: body.name ?? prev.name,
      sku: body.sku ?? prev.sku,
      brand: body.brand ?? prev.brand,
      metadata: m,
      status:
        body.status === "DRAFT"
          ? "draft"
          : body.status === "PUBLISHED"
            ? "active"
            : prev.status,
    },
  });
  return getTire(id);
}

export async function deleteTire(id: string): Promise<void> {
  await getConvexClient().mutation(api.tires.remove, {
    id: id as Id<"tires">,
  });
}
