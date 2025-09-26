export interface CustomerRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: "Active" | "Inactive" | string;
  customerSince?: string;
  orders?: number;
  orderTotal?: number;
  creditLimit?: number;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
  sales?: Array<{
    id: string;
    customerId: string;
    totalAmount: number;
    status: string;
    createdAt?: string;
    updatedAt?: string;
    items?: any[];
    payments?: any[];
  }>;
}

export interface CustomersListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedCustomersResponse {
  data: CustomerRecord[];
  total: number;
  page: number;
  limit: number;
}

export type CustomersListResponse = CustomerRecord[];

export interface CreateCustomerBody {
  name: string;
  email: string;
  phone: string; // International format with + prefix
  address: string;
  creditLimit?: number;
}

export interface UpdateCustomerBody {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}


