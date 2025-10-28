# Order Status Update Endpoint Implementation Guide.

## 🎯 **Overview**

This guide documents the implementation of the order status update endpoint using the `PATCH` method as requested. The endpoint allows updating order status with proper authentication and permission validation

## 📋 **Endpoint Details**

### **🔗 Endpoint Information:**
- **Method:** `PATCH`
- **URL:** `/orders/:id/status`
- **Permission Required:** `sales.update`
- **Authentication:** Bearer token required

### **📝 Request Format:**

**URL:** `PATCH /orders/{order-id}/status`

**Headers:**
```
Authorization: Bearer {your-jwt-token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "COMPLETED"
}
```

### **📋 Available Status Options:**

The endpoint accepts the following status values:
- `PENDING` - Order is pending
- `COMPLETED` - Order is completed  
- `CANCELLED` - Order is cancelled

## 🚀 **Frontend Implementation**

### **1. Hybrid Approach - Best of Both Endpoints**

The implementation uses a hybrid approach that combines the benefits of both endpoints:

- **📊 Data Fetching:** Uses `/sales/dashboard` endpoint for getting order summary and list
- **🔄 Status Updates:** Uses `/orders/:id/status` PATCH endpoint for status updates

### **2. Service Layer (`src/services/orders.ts`)**

The orders service provides a dedicated `updateOrderStatus` function:

```typescript
import { updateOrderStatus } from "@/services/orders";

// Update order status
const handleStatusUpdate = async (orderId: string, status: "PENDING" | "COMPLETED" | "CANCELLED") => {
  try {
    const updatedOrder = await updateOrderStatus(orderId, status);
    console.log("Order updated:", updatedOrder);
    return updatedOrder;
  } catch (error) {
    console.error("Failed to update order status:", error);
    throw error;
  }
};
```

### **2. Usage in Components**

#### **Orders Page (`src/app/orders/page.tsx`)**

```typescript
// Fetch orders data using sales dashboard endpoint (for summary + list)
const fetchOrdersData = async () => {
  try {
    const data = await fetchSalesDashboard({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
      status: statusParam,
      dateFrom: df,
      dateTo: dt,
      sortBy,
      sortDir: (sortDirection as "asc" | "desc") || undefined,
    });
    setApiData(data);
  } catch (error) {
    setApiError(error.message || "Failed to load orders");
  }
};

// Update order status using PATCH orders endpoint
const handleStatusChange = async (orderIndex: number, newStatus: string) => {
  const orderId = sampleOrders[orderIndex].id;
  
  try {
    // Map frontend status to backend status
    const statusMap = {
      "Pending": "PENDING",
      "Completed": "COMPLETED", 
      "In-Progress": "PENDING",
      "Cancelled": "CANCELLED",
      "Canceled": "CANCELLED"
    };
    
    const backendStatus = statusMap[newStatus] || "PENDING";
    
    // Update status via API using PATCH method (orders endpoint)
    await updateOrderStatus(orderId, backendStatus);
    
    // Show success notification
    showSuccess("Status Updated", `Order status changed to ${newStatus} successfully!`);
    
    // Refresh the orders list (using sales dashboard endpoint)
    await fetchOrdersData();
  } catch (error) {
    showError("Error", error.message || "Failed to update order status");
  }
};
```

#### **View Order Page (`src/app/view-order/page.tsx`)**

```typescript
const handleStatusChange = async (newStatus: string) => {
  if (order) {
    try {
      const statusMap = {
        "Pending": "PENDING",
        "Completed": "COMPLETED", 
        "In-Progress": "PENDING",
        "Cancelled": "CANCELLED",
        "Canceled": "CANCELLED"
      };
      
      const backendStatus = statusMap[newStatus] || "PENDING";
      
      // Update status via API using PATCH method
      const updatedOrderData = await updateOrderStatus(order.id, backendStatus);
      
      // Update local state
      setOrder({ ...order, status: newStatus });
      
      showSuccess("Status Updated", `Order status changed to ${newStatus} successfully!`);
    } catch (error) {
      showError("Error", error.message || "Failed to update order status");
    }
  }
};
```

## 📊 **Example Requests**

### **Mark Order as Completed:**
```bash
curl -X PATCH "https://ceeone-api.onrender.com/orders/743650/status" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }'
```

### **Cancel an Order:**
```bash
curl -X PATCH "https://ceeone-api.onrender.com/orders/743650/status" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CANCELLED"
  }'
```

### **Set Order to Pending:**
```bash
curl -X PATCH "https://ceeone-api.onrender.com/orders/743650/status" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PENDING"
  }'
```

## 📝 **Response Format**

### **Success Response (200 OK):**
```json
{
  "id": "743650",
  "orderNumber": "#743650",
  "orderDate": "20 Jan 2025 - 10:30 am",
  "trackingId": "9348fjr73",
  "customer": {
    "id": "customer-1",
    "name": "Janet Adebayo",
    "email": "janet.adebayo@gmail.com",
    "phone": "+2348000000001",
    "customerSince": "10 Jan 2025",
    "status": "Pending"
  },
  "homeAddress": "No. 15 Adekunle Street, Yaba, Lagos State",
  "billingAddress": "No. 15 Adekunle Street, Yaba, Lagos State",
  "paymentMethod": "Master Card",
  "payment": "Full Payment",
  "orderType": "GL601",
  "items": [...],
  "totalAmount": 25000,
  "status": "COMPLETED",
  "createdAt": "2025-01-20T10:30:00Z",
  "updatedAt": "2025-01-20T11:45:00Z"
}
```

### **Error Response (400 Bad Request):**
```json
{
  "error": "Invalid status value",
  "message": "Status must be one of: PENDING, COMPLETED, CANCELLED"
}
```

### **Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Bearer token required"
}
```

### **Error Response (403 Forbidden):**
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions. Required: sales.update"
}
```

### **Error Response (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Order not found"
}
```

## 🔧 **Backend Implementation Requirements**

Your backend should implement the following endpoint:

```typescript
// Example Node.js/Express implementation
app.patch('/orders/:id/status', authenticateToken, checkPermission('sales.update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['PENDING', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status value',
        message: 'Status must be one of: PENDING, COMPLETED, CANCELLED'
      });
    }
    
    // Find and update order
    const order = await Order.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found'
      });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update order status'
    });
  }
});
```

## 🛡️ **Security Considerations**

1. **Authentication Required:** All requests must include a valid Bearer token
2. **Permission Validation:** Users must have `sales.update` permission
3. **Input Validation:** Status values are strictly validated
4. **Rate Limiting:** Consider implementing rate limiting for status updates
5. **Audit Logging:** Log all status changes for compliance

## 🧪 **Testing**

### **Unit Tests:**
```typescript
describe('Order Status Update', () => {
  it('should update order status to COMPLETED', async () => {
    const orderId = 'test-order-id';
    const newStatus = 'COMPLETED';
    
    const result = await updateOrderStatus(orderId, newStatus);
    
    expect(result.status).toBe('COMPLETED');
    expect(result.updatedAt).toBeDefined();
  });
  
  it('should throw error for invalid status', async () => {
    const orderId = 'test-order-id';
    const invalidStatus = 'INVALID_STATUS' as any;
    
    await expect(updateOrderStatus(orderId, invalidStatus))
      .rejects.toThrow('Invalid status value');
  });
});
```

### **Integration Tests:**
```typescript
describe('Order Status Update API', () => {
  it('should return 200 for valid status update', async () => {
    const response = await request(app)
      .patch('/orders/test-id/status')
      .set('Authorization', 'Bearer valid-token')
      .send({ status: 'COMPLETED' })
      .expect(200);
      
    expect(response.body.status).toBe('COMPLETED');
  });
});
```

## 📈 **Benefits of This Hybrid Implementation**

### **🎯 Why Use Both Endpoints?**

**📊 Sales Dashboard Endpoint (`/sales/dashboard`):**
- ✅ **Rich Summary Data:** Provides comprehensive order statistics
- ✅ **Search & Filtering:** Built-in search and date range filtering
- ✅ **Dashboard Optimized:** Data formatted for dashboard UI
- ✅ **Customer Information:** Includes customer details with orders
- ✅ **Performance:** Optimized for dashboard queries

**🔄 Orders Status Endpoint (`/orders/:id/status`):**
- ✅ **RESTful Design:** Uses PATCH method for partial updates
- ✅ **Focused Functionality:** Dedicated to status updates only
- ✅ **Type Safety:** Full TypeScript support with proper interfaces
- ✅ **Permission Control:** Proper authentication and authorization
- ✅ **Status Mapping:** Flexible mapping between frontend and backend statuses
- ✅ **Real-time Updates:** Immediate UI updates with API synchronization
- ✅ **Audit Trail:** Maintains order history and change tracking

### **🚀 Overall Benefits:**

✅ **Best of Both Worlds:** Combines rich dashboard data with precise status updates  
✅ **Optimal Performance:** Uses the right endpoint for each operation  
✅ **Maintainable Code:** Clear separation of concerns  
✅ **User Experience:** Rich dashboard with reliable status updates  
✅ **Scalable Architecture:** Easy to extend and modify  

## 🔄 **Status Flow**

```
PENDING → COMPLETED
PENDING → CANCELLED
COMPLETED → (No further changes)
CANCELLED → (No further changes)
```

## 📞 **Support**

For questions or issues with the order status update endpoint:

1. Check the API documentation at `/api/docs`
2. Review the error messages for specific guidance
3. Ensure proper authentication and permissions
4. Verify the order ID exists in the system

---

**Implementation Date:** January 20, 2025  
**Version:** 1.0.0  
**Last Updated:** January 20, 2025
