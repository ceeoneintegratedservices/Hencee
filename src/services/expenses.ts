import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  department: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  requestDate: string;
  approvedDate?: string;
  paidDate?: string;
  approvedBy?: string;
  paidBy?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    name: string;
    email: string;
  };
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
  data: Expense[];
  total: number;
  page: number;
  limit: number;
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
  category: string;
  department: string;
  priority: 'Low' | 'Medium' | 'High';
  receiptUrl?: string;
  notes?: string;
}

export interface UpdateExpensePayload {
  title?: string;
  description?: string;
  amount?: number;
  category?: string;
  department?: string;
  priority?: 'Low' | 'Medium' | 'High';
  status?: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  receiptUrl?: string;
  notes?: string;
}

/**
 * Fetch list of expenses with optional filtering
 */
export async function listExpenses(params: ExpenseParams = {}): Promise<ExpensesListResponse> {
  try {
    const qp = new URLSearchParams();
    if (params.page != null) qp.set("page", String(params.page));
    if (params.limit != null) qp.set("limit", String(params.limit));
    if (params.search) qp.set("search", params.search);
    if (params.status) qp.set("status", params.status);
    if (params.category) qp.set("category", params.category);
    if (params.department) qp.set("department", params.department);
    if (params.priority) qp.set("priority", params.priority);
    if (params.startDate) qp.set("startDate", params.startDate);
    if (params.endDate) qp.set("endDate", params.endDate);
    
    const url = `${API_ENDPOINTS.expenses}${qp.toString() ? `?${qp.toString()}` : ""}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get a specific expense by ID
 */
export async function getExpense(id: string): Promise<Expense> {
  try {
    const url = `${API_ENDPOINTS.expenses}/${encodeURIComponent(id)}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new expense
 */
export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  try {
    const res = await authFetch(API_ENDPOINTS.expenses, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update an existing expense
 */
export async function updateExpense(id: string, payload: UpdateExpensePayload): Promise<Expense> {
  try {
    const url = `${API_ENDPOINTS.expenses}/${encodeURIComponent(id)}`;
    const res = await authFetch(url, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<void> {
  try {
    const url = `${API_ENDPOINTS.expenses}/${encodeURIComponent(id)}`;
    const res = await authFetch(url, {
      method: "DELETE"
    });
    if (res.status !== 204) {
      const data = await res.json();
      return data;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Get expense categories
 */
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  try {
    const url = `${API_ENDPOINTS.expenses}/categories`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get expense departments
 */
export async function getExpenseDepartments(): Promise<ExpenseDepartment[]> {
  try {
    const url = `${API_ENDPOINTS.expenses}/departments`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}
