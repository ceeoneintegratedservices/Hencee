import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";

export type ExpenseCategoryCode =
  | "TRAVEL"
  | "SUPPLIES"
  | "MAINTENANCE"
  | "UTILITIES"
  | "SALARY"
  | "OTHER";

export interface Expense {
  id: string;
  userId: string;
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategoryCode;
  department?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  vendor?: string;
  invoiceNumber?: string;
  tags?: string[];
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    staffRole: string;
  };
  approvedBy?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseDepartment {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensesListResponse {
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExpenseParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  department?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateExpensePayload {
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategoryCode;
  department?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  receiptUrl?: string;
  vendor?: string;
  invoiceNumber?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateExpensePayload {
  title?: string;
  description?: string;
  amount?: number;
  category?: ExpenseCategoryCode;
  department?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  status?: "Pending" | "Approved" | "Rejected" | "Paid";
  receiptUrl?: string;
  vendor?: string;
  invoiceNumber?: string;
  tags?: string[];
  notes?: string;
}

type ExpenseDoc = {
  _id: Id<"expenses">;
  title: string;
  amount: number;
  category?: string;
  department?: string;
  status?: string;
  expenseDate?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
};

function mapExpenseStatus(raw: string | undefined): Expense["status"] {
  const u = (raw ?? "pending").toUpperCase();
  if (u === "PENDING" || u === "APPROVED" || u === "REJECTED" || u === "PAID") {
    return u;
  }
  return "PENDING";
}

function mapExpense(doc: ExpenseDoc): Expense {
  const meta = doc.metadata ?? {};
  const priority =
    (meta.priority as string | undefined)?.toUpperCase() === "HIGH"
      ? "HIGH"
      : (meta.priority as string | undefined)?.toUpperCase() === "LOW"
        ? "LOW"
        : "MEDIUM";
  return {
    id: doc._id,
    userId: doc.createdBy ?? "",
    title: doc.title,
    description: doc.description ?? "",
    amount: doc.amount,
    category: (doc.category as ExpenseCategoryCode) ?? "OTHER",
    department: doc.department,
    priority: priority as Expense["priority"],
    status: mapExpenseStatus(doc.status),
    vendor: meta.vendor as string | undefined,
    invoiceNumber: meta.invoiceNumber as string | undefined,
    tags: meta.tags as string[] | undefined,
    approvedById: meta.approvedById as string | undefined,
    approvedAt: meta.approvedAt as string | undefined,
    rejectionReason: meta.rejectionReason as string | undefined,
    receiptUrl: meta.receiptUrl as string | undefined,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
    user: {
      id: doc.createdBy ?? "",
      name: "",
      email: "",
      staffRole: "",
    },
    approvedBy: meta.approvedBy as string | undefined,
  };
}

export async function listExpenses(
  params: ExpenseParams = {}
): Promise<ExpensesListResponse> {
  const data = await getConvexClient().query(api.expenses.list, {
    page: params.page,
    limit: params.limit,
    search: params.search,
    status: params.status,
    category: params.category,
    department: params.department,
    priority: params.priority,
    startDate: params.startDate,
    endDate: params.endDate,
  });
  return {
    expenses: (data.expenses as ExpenseDoc[]).map(mapExpense),
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export async function getExpense(id: string): Promise<Expense> {
  const doc = await getConvexClient().query(api.expenses.get, {
    id: id as Id<"expenses">,
  });
  return mapExpense(doc as ExpenseDoc);
}

export async function createExpense(
  payload: CreateExpensePayload
): Promise<Expense> {
  const id = await getConvexClient().mutation(api.expenses.create, {
    title: payload.title,
    amount: payload.amount,
    category: payload.category,
    department: payload.department,
    description: payload.description,
    metadata: {
      priority: payload.priority,
      receiptUrl: payload.receiptUrl,
      vendor: payload.vendor,
      invoiceNumber: payload.invoiceNumber,
      tags: payload.tags,
      notes: payload.notes,
    },
  });
  return getExpense(id as string);
}

function mapUpdateStatus(
  s: NonNullable<UpdateExpensePayload["status"]>
): string {
  const m: Record<string, string> = {
    Pending: "pending",
    Approved: "approved",
    Rejected: "rejected",
    Paid: "paid",
  };
  return m[s] ?? "pending";
}

export async function updateExpense(
  id: string,
  payload: UpdateExpensePayload
): Promise<Expense> {
  const patch: Record<string, unknown> = {};
  if (payload.title != null) patch.title = payload.title;
  if (payload.description != null) patch.description = payload.description;
  if (payload.amount != null) patch.amount = payload.amount;
  if (payload.category != null) patch.category = payload.category;
  if (payload.department != null) patch.department = payload.department;
  if (payload.status != null) patch.status = mapUpdateStatus(payload.status);

  const metaKeys = [
    "priority",
    "receiptUrl",
    "vendor",
    "invoiceNumber",
    "tags",
    "notes",
  ] as const;
  const meta: Record<string, unknown> = {};
  for (const k of metaKeys) {
    if (payload[k] !== undefined) meta[k] = payload[k];
  }
  if (Object.keys(meta).length) {
    const existing = await getConvexClient().query(api.expenses.get, {
      id: id as Id<"expenses">,
    });
    const prev = (existing as ExpenseDoc).metadata ?? {};
    patch.metadata = { ...prev, ...meta };
  }

  await getConvexClient().mutation(api.expenses.update, {
    id: id as Id<"expenses">,
    patch,
  });
  return getExpense(id);
}

export async function deleteExpense(id: string): Promise<void> {
  await getConvexClient().mutation(api.expenses.remove, {
    id: id as Id<"expenses">,
  });
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const rows = await getConvexClient().query(api.expenses.expenseCategories, {});
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    description: undefined,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export async function getExpenseDepartments(): Promise<ExpenseDepartment[]> {
  const rows = await getConvexClient().query(api.expenses.expenseDepartments, {});
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    description: undefined,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}
