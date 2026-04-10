// Customer Portal Service (Convex)
import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";
import type {
  CustomerProfile,
  CustomerOrder,
  CustomerOrdersResponse,
  OrderItem,
  ProductSearchResult,
  CreateOrderPayload,
  CustomerDebt,
  PayDebtPayload,
  RefundRequestPayload,
  SupportTicketPayload,
  SupportTicket,
  CustomerNotification,
} from "../types/customerPortal";

function mapCustomerDoc(
  doc: Record<string, unknown> & { _id?: Id<"customers"> }
): CustomerProfile {
  return {
    id: String(doc._id ?? doc.id ?? ""),
    name: String(doc.name ?? ""),
    email: doc.email as string | undefined,
    phone: doc.phone as string | undefined,
    address: doc.address as string | undefined,
    profileImageUrl: doc.profileImageUrl as string | undefined,
    customerSince:
      typeof doc.customerSince === "string"
        ? doc.customerSince
        : typeof doc.createdAt === "number"
          ? new Date(doc.createdAt).toISOString()
          : undefined,
    status: doc.status as string | undefined,
    creditLimit: doc.creditLimit as number | undefined,
    balance: doc.outstandingBalance as number | undefined,
  };
}

function mapOrderItems(raw: unknown): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((it: Record<string, unknown>, i: number) => ({
    id: String(it.id ?? `item-${i}`),
    productId: String(it.productId ?? ""),
    productName: String(it.productName ?? it.name ?? "Item"),
    quantity: Number(it.quantity ?? 0),
    unitPrice: Number(it.unitPrice ?? 0),
    totalPrice: Number(it.totalPrice ?? it.orderTotal ?? 0),
    status: it.status as string | undefined,
  }));
}

function mapSaleToCustomerOrder(doc: Record<string, unknown>): CustomerOrder {
  const id = String(doc._id ?? doc.id ?? "");
  const st = String(doc.status ?? "Pending").toUpperCase();
  let status: CustomerOrder["status"] = "PROCESSING";
  if (st.includes("COMPLET")) status = "COMPLETED";
  else if (st.includes("CANCEL")) status = "CANCELLED";
  else if (st.includes("PENDING")) status = "PENDING";

  const total = Number(doc.totalAmount ?? 0);
  const paid = Number(doc.paymentAmount ?? 0);
  let paymentStatus: CustomerOrder["paymentStatus"] = "PENDING";
  if (paid <= 0) paymentStatus = "PENDING";
  else if (paid >= total) paymentStatus = "COMPLETED";
  else paymentStatus = "PARTIAL";

  return {
    id,
    orderNumber: doc.orderNumber as string | undefined,
    createdAt: new Date((doc.createdAt as number) ?? 0).toISOString(),
    updatedAt: new Date((doc.updatedAt as number) ?? 0).toISOString(),
    status,
    paymentStatus,
    totalAmount: total,
    paidAmount: paid,
    outstandingBalance: Math.max(0, total - paid),
    items: mapOrderItems(doc.items),
    note: typeof doc.metadata === "object" && doc.metadata && "notes" in (doc.metadata as object)
      ? String((doc.metadata as { notes?: string }).notes)
      : undefined,
  };
}

function mapDebtRow(row: Record<string, unknown>): CustomerDebt {
  return {
    id: String(row.id ?? "debt"),
    orderId: String(row.orderId ?? ""),
    orderNumber: row.orderNumber as string | undefined,
    totalAmount: Number(row.totalAmount ?? 0),
    paidAmount: Number(row.paidAmount ?? 0),
    outstandingBalance: Number(row.outstandingBalance ?? row.totalAmount ?? 0),
    dueDate: row.dueDate as string | undefined,
    createdAt:
      typeof row.createdAt === "string"
        ? row.createdAt
        : new Date((row.createdAt as number) ?? 0).toISOString(),
    status: String(row.status ?? "OUTSTANDING"),
  };
}

function mapNotificationRow(
  doc: Record<string, unknown> & { _id?: Id<"notifications"> }
): CustomerNotification {
  const body = doc.body as string | undefined;
  return {
    id: String(doc._id ?? doc.id ?? ""),
    title: String(doc.title ?? ""),
    message: body ?? "",
    type: (doc.type as CustomerNotification["type"]) ?? "general",
    read: Boolean(doc.read),
    createdAt: new Date((doc.createdAt as number) ?? 0).toISOString(),
  };
}

export async function getMyProfile(): Promise<CustomerProfile> {
  const data = await getConvexClient().query(api.customerPortal.me, {});
  return data as CustomerProfile;
}

export async function updateMyProfile(
  updates: Partial<Pick<CustomerProfile, "email" | "phone" | "address" | "profileImageUrl">>
): Promise<CustomerProfile> {
  const data = await getConvexClient().mutation(api.customerPortal.updateMe, updates);
  return mapCustomerDoc(data as Record<string, unknown> & { _id?: Id<"customers"> });
}

export async function getMyOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<CustomerOrdersResponse> {
  const raw = await getConvexClient().query(api.customerPortal.myOrders, {
    page: params?.page,
    limit: params?.limit,
    status: params?.status,
  });
  const pack = raw as {
    data: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
  };
  return {
    data: pack.data.map(mapSaleToCustomerOrder),
    total: pack.total,
    page: pack.page,
    limit: pack.limit,
  };
}

function estimateTotal(payload: CreateOrderPayload): number {
  if (
    "totalAmount" in payload &&
    typeof (payload as { totalAmount?: number }).totalAmount === "number"
  ) {
    return (payload as { totalAmount: number }).totalAmount;
  }
  return (payload.items ?? []).reduce((a, i) => a + i.quantity * 1, 1);
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<CustomerOrder> {
  const doc = await getConvexClient().mutation(api.customerPortal.createOrder, {
    items: payload.items,
    totalAmount: estimateTotal(payload),
  });
  return mapSaleToCustomerOrder(doc as Record<string, unknown>);
}

export async function searchProducts(params: {
  q?: string;
  category?: string;
}): Promise<ProductSearchResult[]> {
  const rows = await getConvexClient().query(api.customerPortal.searchProducts, {
    q: params.q,
    category: params.category,
  });
  return (rows as unknown[]).map((r: unknown) => {
    const row = r as {
      _id: string;
      name: string;
      sku?: string;
      sellingPrice?: number;
      categoryName?: string;
      categoryId?: string;
      description?: string;
    };
    return {
      id: String(row._id),
      name: row.name,
      sku: row.sku,
      sellingPrice: row.sellingPrice ?? 0,
      category: row.categoryName,
      categoryId: row.categoryId ? String(row.categoryId) : undefined,
      stock: 0,
      description: row.description,
    } satisfies ProductSearchResult;
  });
}

export async function getMyDebts(): Promise<CustomerDebt[]> {
  const rows = await getConvexClient().query(api.customerPortal.myDebts, {});
  return (rows as Record<string, unknown>[]).map(mapDebtRow);
}

export async function payDebt(
  payload: PayDebtPayload
): Promise<{ success: boolean; message: string }> {
  return getConvexClient().mutation(api.customerPortal.payDebt, {
    amount: payload.amount,
  });
}

export async function requestRefund(
  payload: RefundRequestPayload
): Promise<{ success: boolean; message: string }> {
  return getConvexClient().mutation(api.customerPortal.requestRefund, { payload });
}

export async function createSupportTicket(
  payload: SupportTicketPayload
): Promise<SupportTicket> {
  const doc = await getConvexClient().mutation(api.customerPortal.createTicket, {
    subject: payload.subject,
    body: payload.message,
  });
  const d = doc as Record<string, unknown> & { _id?: Id<"supportTickets"> };
  return {
    id: String(d._id ?? ""),
    subject: String(d.subject ?? payload.subject),
    message: String(d.body ?? payload.message),
    status: "OPEN",
    createdAt: new Date((d.createdAt as number) ?? 0).toISOString(),
    updatedAt: new Date((d.updatedAt as number) ?? 0).toISOString(),
  };
}

export async function getNotifications(): Promise<CustomerNotification[]> {
  const rows = await getConvexClient().query(api.customerPortal.notifications, {});
  return (rows as Record<string, unknown>[]).map((r) =>
    mapNotificationRow(r as Record<string, unknown> & { _id?: Id<"notifications"> })
  );
}
