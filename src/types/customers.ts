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

export type CustomersListResponse = CustomerRecord[];

export interface CreateCustomerBody {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerBody {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}


