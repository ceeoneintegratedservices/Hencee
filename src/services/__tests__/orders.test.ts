/**
 * @jest-environment jsdom
 */

import { updateOrderStatus, fetchOrdersDashboard } from '../orders';

// Mock the authFetch function
jest.mock('../authFetch', () => ({
  authFetch: jest.fn(),
}));

import { authFetch } from '../authFetch';
const mockAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;

describe('Orders Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = {
        id: 'test-order-id',
        orderNumber: '#743650',
        status: 'COMPLETED',
        updatedAt: '2025-01-20T11:45:00Z'
      };

      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      } as Response);

      const result = await updateOrderStatus('test-order-id', 'COMPLETED');

      expect(mockAuthFetch).toHaveBeenCalledWith(
        'https://ceeone-api.onrender.com/orders/test-order-id/status',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'COMPLETED' }),
        }
      );

      expect(result).toEqual(mockOrder);
    });

    it('should handle API errors', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Order not found' }),
      } as Response);

      await expect(updateOrderStatus('invalid-id', 'COMPLETED'))
        .rejects.toThrow('Order not found');
    });

    it('should handle network errors', async () => {
      mockAuthFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(updateOrderStatus('test-order-id', 'COMPLETED'))
        .rejects.toThrow('Network error');
    });
  });

  describe('fetchOrdersDashboard', () => {
    it('should fetch orders dashboard successfully', async () => {
      const mockResponse = {
        summary: {
          allOrders: 100,
          pending: 20,
          completed: 70,
          canceled: 10,
          returned: 0,
          damaged: 0,
          abandonedCart: 5,
          customers: 50
        },
        orders: [
          {
            id: '1',
            customerName: 'John Doe',
            orderDate: '2025-01-20',
            orderType: 'GL601',
            trackingId: 'TRK123',
            orderTotal: '25000',
            status: 'COMPLETED'
          }
        ],
        total: 100,
        page: 1,
        limit: 10
      };

      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchOrdersDashboard({ page: 1, limit: 10 });

      expect(mockAuthFetch).toHaveBeenCalledWith(
        'https://ceeone-api.onrender.com/orders?page=1&limit=10'
      );

      expect(result).toEqual(mockResponse);
    });
  });
});
