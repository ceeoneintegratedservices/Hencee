import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

// Types for Payments API
export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayment {
  saleId: string;
  amount: number;
  method: string; // 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_MONEY' | 'CREDIT'
  reference?: string;
  notes?: string;
  // Pharma-specific payment fields
  senderName?: string; // For BANK_TRANSFER
  transactionReference?: string; // For BANK_TRANSFER
  chequeNumber?: string; // For CHEQUE
  accountName?: string; // For CHEQUE
}

export interface UpdatePaymentStatus {
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
}

export interface PaymentRefund {
  amount: number;
  reason: string;
  notes?: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  refundedPayments: number;
  averagePaymentAmount: number;
}

// Payments API Functions
export async function getPayments(params: {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}): Promise<Payment[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.status) queryParams.set('status', params.status);
    if (params.method) queryParams.set('method', params.method);
    if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.set('dateTo', params.dateTo);

    const url = `${API_ENDPOINTS.payments}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
}

export async function getPaymentById(id: string): Promise<Payment> {
  try {
    const response = await authFetch(API_ENDPOINTS.paymentById(id));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
}

export async function createPayment(paymentData: CreatePayment): Promise<Payment> {
  try {
    const response = await authFetch(API_ENDPOINTS.payments, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}

export async function updatePaymentStatus(id: string, statusData: UpdatePaymentStatus): Promise<Payment> {
  try {
    const response = await authFetch(API_ENDPOINTS.paymentStatus(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update payment status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

export async function getPaymentsBySale(saleId: string): Promise<Payment[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.paymentsBySale(saleId));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching payments by sale:', error);
    throw error;
  }
}

export async function getPaymentsByMethod(method: string): Promise<Payment[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.paymentsByMethod(method));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching payments by method:', error);
    throw error;
  }
}

export async function getPaymentsByStatus(status: string): Promise<Payment[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.paymentsByStatus(status));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching payments by status:', error);
    throw error;
  }
}

export async function getPaymentsByDateRange(dateFrom: string, dateTo: string): Promise<Payment[]> {
  try {
    const queryParams = new URLSearchParams({
      dateFrom,
      dateTo,
    });
    
    const url = `${API_ENDPOINTS.paymentsDateRange}?${queryParams.toString()}`;
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching payments by date range:', error);
    throw error;
  }
}

export async function getPaymentByReference(reference: string): Promise<Payment> {
  try {
    const response = await authFetch(API_ENDPOINTS.paymentByReference(reference));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching payment by reference:', error);
    throw error;
  }
}

export async function getDailyPayments(date: string): Promise<Payment[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.paymentsDaily(date));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching daily payments:', error);
    throw error;
  }
}

export async function getPendingPayments(): Promise<Payment[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.paymentsPending);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    throw error;
  }
}

export async function getPaymentStats(): Promise<PaymentStats> {
  try {
    const response = await authFetch(API_ENDPOINTS.paymentsStats);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    throw error;
  }
}

export async function processPaymentRefund(id: string, refundData: PaymentRefund): Promise<Payment> {
  try {
    const response = await authFetch(API_ENDPOINTS.paymentRefund(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refundData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process payment refund');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error processing payment refund:', error);
    throw error;
  }
}