# Backend Requirements for Notifications System

## Overview
The frontend notification system fetches important notifications from the dashboard activities endpoint. The backend needs to ensure the `/api/ceeone/dashboard/activities` endpoint returns activities that can be converted into notifications.

## Required Endpoint

### GET `/api/ceeone/dashboard/activities`

**Query Parameters:**
- `timeframe` (optional): `'thisWeek' | 'lastWeek' | 'thisMonth' | 'last7days' | 'allTime'`
  - Default: `'thisWeek'`

**Response Format:**
```json
{
  "activities": [
    {
      "id": "string",
      "type": "sale" | "order" | "customer" | "product" | "user" | "inventory" | "payment" | "security",
      "description": "string",
      "timestamp": "ISO 8601 date string",
      "amount": "number (optional)",
      "entityId": "string (optional)",
      "user": "string (optional)"
    }
  ],
  "recentActivities": [
    {
      "id": "string",
      "type": "string",
      "action": "string (optional)",
      "description": "string",
      "message": "string (optional)",
      "timestamp": "ISO 8601 date string",
      "createdAt": "ISO 8601 date string (optional)",
      "date": "ISO 8601 date string (optional)",
      "entityId": "string (optional)",
      "user": "string (optional)"
    }
  ]
}
```

**Note:** The frontend looks for `recentActivities` array. If your backend returns `activities`, you can also include `recentActivities` with the same data, or the frontend will fall back to `activities`.

## Required Activity Types

The backend must track and return activities for these important notification types:

### 1. **New Orders** (`type: "order"` or `type: "sale"`)
- **When to create:** When a new sale/order is created
- **Required fields:**
  - `type`: `"order"` or `"sale"`
  - `description`: e.g., `"Order #12345 has been placed by John Smith"`
  - `entityId`: The order/sale ID
  - `timestamp`: When the order was created
- **Example:**
  ```json
  {
    "id": "act-001",
    "type": "order",
    "action": "create",
    "description": "Order #12345 has been placed by John Smith",
    "entityId": "12345",
    "timestamp": "2024-11-30T12:00:00Z"
  }
  ```

### 2. **Payments Received** (`type: "payment"`)
- **When to create:** When a payment is received/recorded
- **Required fields:**
  - `type`: `"payment"`
  - `description`: e.g., `"Payment of ₦150,000 received for Order #12340"`
  - `entityId`: The order/sale ID
  - `amount`: Payment amount (optional)
  - `timestamp`: When the payment was received
- **Example:**
  ```json
  {
    "id": "act-002",
    "type": "payment",
    "action": "received",
    "description": "Payment of ₦150,000 received for Order #12340",
    "entityId": "12340",
    "amount": 150000,
    "timestamp": "2024-11-30T11:30:00Z"
  }
  ```

### 3. **Low Stock Alerts** (`type: "inventory"`)
- **When to create:** When product stock falls below reorder level
- **Required fields:**
  - `type`: `"inventory"`
  - `action`: Should include `"low"` or `"stock"` in the string
  - `description`: e.g., `"GL601 tyres are running low (5 units remaining)"`
  - `entityId`: The product ID
  - `timestamp`: When the alert was triggered
- **Example:**
  ```json
  {
    "id": "act-003",
    "type": "inventory",
    "action": "low_stock",
    "description": "Panadol is running low (5 units remaining)",
    "entityId": "prod-123",
    "timestamp": "2024-11-30T10:00:00Z"
  }
  ```

### 4. **New Login** (`type: "security"`)
- **When to create:** When a user logs in (especially from a new device/location)
- **Required fields:**
  - `type`: `"security"` or `"user"`
  - `action`: Should include `"login"` or `"auth"` in the string
  - `description`: e.g., `"New login detected from IP 192.168.1.1"`
  - `user`: User email or name
  - `timestamp`: When the login occurred
- **Example:**
  ```json
  {
    "id": "act-004",
    "type": "security",
    "action": "login",
    "description": "New login detected for admin@example.com",
    "user": "admin@example.com",
    "timestamp": "2024-11-30T09:00:00Z"
  }
  ```

### 5. **Password Reset** (`type: "security"`)
- **When to create:** When a password reset is requested or completed
- **Required fields:**
  - `type`: `"security"` or `"user"`
  - `action`: Should include `"password"` or `"reset"` in the string
  - `description`: e.g., `"Password reset requested for admin@example.com"`
  - `user`: User email or name
  - `timestamp`: When the reset was requested
- **Example:**
  ```json
  {
    "id": "act-005",
    "type": "security",
    "action": "password_reset",
    "description": "Password reset requested for admin@example.com",
    "user": "admin@example.com",
    "timestamp": "2024-11-30T08:00:00Z"
  }
  ```

## Implementation Guidelines

### 1. Activity Tracking
The backend should create activity records in the following scenarios:

- **Order Creation:** When `POST /api/ceeone/sales` is called successfully
- **Payment Recording:** When a payment is recorded (via payment endpoints)
- **Low Stock Detection:** 
  - When inventory is updated and stock falls below reorder level
  - Consider running a periodic check for low stock items
- **User Login:** When `POST /api/ceeone/auth/login` is called successfully
- **Password Reset:** When `POST /api/ceeone/auth/password/forgot` or `/reset` is called

### 2. Activity Storage
Store activities in a database table with these fields:
- `id` (string/UUID)
- `type` (enum: order, payment, inventory, security, etc.)
- `action` (string: create, received, low_stock, login, password_reset, etc.)
- `description` (string: human-readable description)
- `message` (string, optional: additional message)
- `entityId` (string, optional: ID of related entity like order ID, product ID)
- `userId` (string, optional: ID of user who triggered the action)
- `user` (string, optional: user email/name for display)
- `amount` (number, optional: for payment activities)
- `timestamp` / `createdAt` (datetime: ISO 8601 format)
- `metadata` (JSON, optional: additional context)

### 3. Query Implementation
The `/api/ceeone/dashboard/activities` endpoint should:

1. **Filter by timeframe:**
   - `thisWeek`: Activities from the start of current week
   - `lastWeek`: Activities from previous week
   - `thisMonth`: Activities from start of current month
   - `last7days`: Activities from last 7 days
   - `allTime`: All activities (consider pagination)

2. **Return recent activities:**
   - Sort by `timestamp` descending (newest first)
   - Limit to reasonable number (e.g., 50-100 most recent)
   - Include both `activities` and `recentActivities` arrays for compatibility

3. **Filter important activities:**
   - Optionally filter to only return important notification types
   - Or return all activities and let frontend filter

### 4. Example Backend Implementation (Pseudocode)

```typescript
// When order is created
async function createSale(saleData) {
  const sale = await saleRepository.create(saleData);
  
  // Create activity
  await activityRepository.create({
    type: 'order',
    action: 'create',
    description: `Order #${sale.id} has been placed by ${customer.name}`,
    entityId: sale.id,
    userId: currentUser.id,
    timestamp: new Date()
  });
  
  return sale;
}

// When payment is received
async function recordPayment(paymentData) {
  const payment = await paymentRepository.create(paymentData);
  
  await activityRepository.create({
    type: 'payment',
    action: 'received',
    description: `Payment of ₦${payment.amount} received for Order #${payment.saleId}`,
    entityId: payment.saleId,
    amount: payment.amount,
    timestamp: new Date()
  });
  
  return payment;
}

// When stock is low
async function checkLowStock() {
  const lowStockProducts = await productRepository.findLowStock();
  
  for (const product of lowStockProducts) {
    await activityRepository.create({
      type: 'inventory',
      action: 'low_stock',
      description: `${product.name} is running low (${product.stock} units remaining)`,
      entityId: product.id,
      timestamp: new Date()
    });
  }
}

// When user logs in
async function login(credentials) {
  const user = await authenticate(credentials);
  
  await activityRepository.create({
    type: 'security',
    action: 'login',
    description: `New login detected for ${user.email}`,
    user: user.email,
    userId: user.id,
    timestamp: new Date()
  });
  
  return user;
}
```

## Testing Checklist

- [ ] Order creation creates activity with type "order"
- [ ] Payment recording creates activity with type "payment"
- [ ] Low stock detection creates activity with type "inventory"
- [ ] User login creates activity with type "security" with action "login"
- [ ] Password reset creates activity with type "security" with action "password_reset"
- [ ] Activities endpoint returns data in correct format
- [ ] Activities are filtered by timeframe correctly
- [ ] Activities are sorted by timestamp (newest first)
- [ ] `recentActivities` array is included in response

## Notes

- The frontend will automatically filter activities to only show important notification types
- Timestamps should be in ISO 8601 format (e.g., `"2024-11-30T12:00:00Z"`)
- The frontend handles time formatting (e.g., "2 minutes ago"), so raw timestamps are fine
- Consider implementing pagination if returning large numbers of activities
- Activities should be tenant-specific (filtered by appId/tenantId)

