// Customer Portal Types

export interface CustomerProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  customerSince?: string;
  status?: string;
  creditLimit?: number;
  balance?: number;
  stats?: {
    totalOrders: number;
    totalSpent: number;
    outstandingBalance: number;
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status?: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber?: string;
  createdAt: string;
  updatedAt?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'PROCESSING';
  paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  totalAmount: number;
  paidAmount: number;
  outstandingBalance?: number;
  items: OrderItem[];
  note?: string;
}

export interface CustomerOrdersResponse {
  data: CustomerOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  sku?: string;
  sellingPrice: number;
  costPrice?: number;
  category?: string;
  categoryId?: string;
  stock: number;
  description?: string;
  imageUrl?: string;
  unit?: string;
}

export interface CreateOrderPayload {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  paymentType?: 'FULL' | 'PARTIAL' | 'CREDIT';
  paymentMethod?: 'CASH' | 'TRANSFER' | 'CARD' | 'CHEQUE';
  paymentAmount?: number;
  note?: string;
}

export interface CustomerDebt {
  id: string;
  orderId: string;
  orderNumber?: string;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  dueDate?: string;
  createdAt: string;
  status: string;
}

export interface PayDebtPayload {
  orderId: string;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD' | 'CHEQUE';
  reference?: string;
  proofImageUrl?: string;
}

export interface RefundRequestPayload {
  orderId: string;
  type: 'refund' | 'exchange';
  reason: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  replacementProductId?: string;
}

export interface SupportTicketPayload {
  subject: string;
  message: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: 'payment' | 'order' | 'overdue' | 'general';
  read: boolean;
  createdAt: string;
}
