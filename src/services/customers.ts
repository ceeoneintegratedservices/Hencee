import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";
import type {
  CustomersListQuery,
  CustomersListResponse,
  CustomerRecord,
  CreateCustomerBody,
  UpdateCustomerBody,
  PaginatedCustomersResponse,
} from "../types/customers";

function asCustomerId(id: string): Id<"customers"> {
  return id as Id<"customers">;
}

export async function listCustomers(params: CustomersListQuery = {}): Promise<CustomersListResponse> {
  const data = await getConvexClient().query(api.customers.listPaginated, {
    page: params.page,
    limit: params.limit,
    search: params.search,
  });
  return data.data;
}

export async function listCustomersPaginated(
  params: CustomersListQuery = {}
): Promise<PaginatedCustomersResponse> {
  return getConvexClient().query(api.customers.listPaginated, {
    page: params.page,
    limit: params.limit,
    search: params.search,
  });
}

export async function getCustomer(id: string): Promise<CustomerRecord> {
  return getConvexClient().query(api.customers.get, { id: asCustomerId(id) });
}

export async function createCustomer(body: CreateCustomerBody): Promise<CustomerRecord> {
  return getConvexClient().mutation(api.customers.create, {
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: body.address,
    creditLimit: body.creditLimit,
  });
}

export async function updateCustomer(id: string, body: UpdateCustomerBody): Promise<CustomerRecord> {
  return getConvexClient().mutation(api.customers.update, {
    id: asCustomerId(id),
    ...body,
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await getConvexClient().mutation(api.customers.remove, { id: asCustomerId(id) });
}

export async function getCustomerSales(id: string): Promise<unknown[]> {
  return getConvexClient().query(api.customers.customerSales, {
    customerId: asCustomerId(id),
  });
}

export async function searchCustomers(query: string): Promise<CustomerRecord[]> {
  return getConvexClient().query(api.customers.searchCustomers, { query });
}

export async function getOutstandingBalances(): Promise<unknown[]> {
  return getConvexClient().query(api.customers.outstandingBalances, {});
}

export async function getTopCustomers(): Promise<CustomerRecord[]> {
  return getConvexClient().query(api.customers.topCustomers, {});
}

export async function updateCustomerCreditLimit(
  id: string,
  creditLimit: number
): Promise<CustomerRecord> {
  return getConvexClient().mutation(api.customers.updateCreditLimit, {
    id: asCustomerId(id),
    creditLimit,
  });
}

export interface CustomerStats {
  totalPurchases: number;
  totalAmount: number;
  outstandingBalance: number;
  lastPurchaseDate?: string;
  averagePurchaseAmount: number;
  orderHistory?: Array<{
    id: string;
    orderNumber: string;
    orderDate: string;
    totalAmount: number;
    status: string;
    payment?: string;
  }>;
}

export interface TopCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalPurchases: number;
  totalAmount: number;
  lastPurchaseDate?: string;
  rank: number;
}

export interface OutstandingBalanceCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  outstandingBalance: number;
  creditLimit: number;
  lastPurchaseDate?: string;
  totalOrders?: number;
  totalPurchases?: number;
}

export async function getCustomerStats(id: string): Promise<CustomerStats> {
  const s = await getConvexClient().query(api.customers.customerStats, {
    customerId: asCustomerId(id),
  });
  const totalPurchases = s.totalOrders;
  const totalAmount = s.totalSpent;
  return {
    totalPurchases,
    totalAmount,
    outstandingBalance: s.outstandingBalance ?? 0,
    lastPurchaseDate: s.lastOrderDate,
    averagePurchaseAmount: totalPurchases ? totalAmount / totalPurchases : 0,
    orderHistory: (s.orderHistory ?? []).map((row: any) => ({
      id: String(row.id),
      orderNumber: String(row.orderNumber ?? ""),
      orderDate: String(row.orderDate ?? ""),
      totalAmount: Number(row.totalAmount ?? 0),
      status: String(row.status ?? ""),
      payment: row.payment ? String(row.payment) : undefined,
    })),
  };
}

export async function getOutstandingBalanceCustomers(): Promise<OutstandingBalanceCustomer[]> {
  const rows = await getConvexClient().query(api.customers.outstandingBalanceCustomers, {});
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    email: r.email,
    phone: undefined,
    outstandingBalance: r.outstandingBalance,
    creditLimit: r.creditLimit ?? 0,
    lastPurchaseDate: r.lastPurchaseDate,
    totalOrders: r.totalOrders,
    totalPurchases: r.totalPurchases,
  }));
}
