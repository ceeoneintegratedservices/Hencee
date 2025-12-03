# View Order Page - Dummy Data Analysis

This document identifies what data is **NOT** coming from the backend and what parts still use **dummy/fallback data** on the `/view-order` page.

---

## 🔴 **DUMMY DATA FALLBACKS** (Used when API fails)

### 1. **Main Order Data** (Lines 247-256)
**Location**: `src/app/view-order/page.tsx` - `fetchOrderData()` catch block

**When Used**: When `getOrderById(finalOrderId)` API call fails

**Dummy Data Generated**:
- **Order Number**: `#743648`, `#743649`, etc. (sequential)
- **Order Date**: Generated dates going back in time (e.g., "12 Aug 2022 - 12:25 am")
- **Tracking ID**: `9348fjr73`, `9348fjr74`, etc. (sequential)
- **Customer**: Hardcoded customer names from `OrderDataService.CUSTOMERS` array:
  - Janet Adebayo, Michael Johnson, Sarah Williams, David Brown, etc.
- **Customer Email**: Generated from customer name (e.g., `janet.adebayo@gmail.com`)
- **Customer Phone**: Generated sequential numbers (`+2348000000000`, `+2348000000001`, etc.)
- **Customer Since**: Generated dates
- **Home Address**: Hardcoded `"No. 15 Adekunle Street, Yaba, Lagos State"`
- **Billing Address**: Hardcoded `"No. 15 Adekunle Street, Yaba, Lagos State"`
- **Payment Method**: Rotates through `["Master Card", "Visa Card", "PayPal", "Bank Transfer"]`
- **Payment Type**: Rotates between "Full Payment" and "Part Payment"
- **Payment Amount**: Random calculation for part payments
- **Order Type**: Rotates through `["GL601", "GL602", "GL908", "DW703tx"]`
- **Order Items**: Generated tyre products:
  - Michelin Pilot Sport 4
  - Bridgestone Potenza RE-71R
  - Continental ContiSportContact 5
  - Goodyear Eagle F1 Asymmetric 5
  - Dunlop SP Sport Maxx 050
  - Pirelli P Zero PZ4
  - Hankook Ventus V12 evo2
  - Maxxis Victra MA-Z1
  - Firestone Firehawk Indy 500
  - Yokohama Advan Sport V105
- **Item Prices**: Calculated from total order amount
- **Item Quantities**: Random (1-3)
- **Item Discounts**: Random (10% chance of 10% discount)
- **Warehouse Numbers**: Generated `WH-001`, `WH-002`, etc.
- **Order Total**: Base amount (`₦25,000`) + increments (`₦1,000` per order)
- **Order Status**: Rotates through `["Completed", "In-Progress", "Pending"]`

**Code Reference**:
```typescript
// Line 249
const orderData = OrderDataService.generateOrder(finalOrderId);
```

---

### 2. **Previous Orders** (Lines 238-245)
**Location**: `src/app/view-order/page.tsx` - `fetchOrderData()` catch block

**When Used**: When `getSalesByCustomer(orderData.customer.id)` API call fails

**Dummy Data Generated**:
- **Previous Orders**: 2-3 previous orders for the same customer
- Uses same dummy data structure as main order
- Order IDs are sequential (e.g., if current order is `order-5`, previous orders are `order-4`, `order-3`, `order-2`)

**Code Reference**:
```typescript
// Line 240-243
const previousOrdersData = OrderDataService.generatePreviousOrders(
  orderData.customer.id,
  finalOrderId
);
```

---

## 🟡 **FALLBACK VALUES** (Used when API data is missing)

### 3. **Order Data Mapping** (Lines 154-188)
**Location**: `src/app/view-order/page.tsx` - `fetchOrderData()` try block

**Fallback Values Used**:
- **Order Number**: `#${apiResponse.id}` if `orderNumber` is missing
- **Order Date**: Uses `createdAt` if `orderDate` is missing
- **Tracking ID**: `TRK${apiResponse.id}` if `trackingId` is missing
- **Customer Name**: `"Unknown Customer"` if customer name is missing
- **Customer Email**: Empty string if missing
- **Customer Phone**: Empty string if missing
- **Customer Since**: Current date if missing
- **Customer Status**: `"Active"` if missing
- **Home Address**: Empty string if missing
- **Billing Address**: Empty string if missing
- **Payment Method**: `"Cash"` if missing
- **Payment Type**: `"Full Payment"` if missing
- **Payment Amount**: Uses `totalAmount` if `paymentAmount` is missing
- **Order Type**: `"Pick Up"` if missing
- **Product Name**: `"Unknown Product"` if product name is missing
- **Product Image**: Empty string if missing
- **Unit Price**: `0` if missing
- **Quantity**: `1` if missing
- **Discount**: `0` if missing
- **Order Total**: `0` if missing
- **Item Status**: `"Pending"` if missing
- **Order Status**: `"Pending"` if missing

**Code Reference**:
```typescript
// Lines 154-188
const orderData: Order = {
  id: apiResponse.id,
  orderNumber: apiResponse.orderNumber || `#${apiResponse.id}`,
  orderDate: apiResponse.orderDate || apiResponse.createdAt,
  trackingId: apiResponse.trackingId || `TRK${apiResponse.id}`,
  customer: {
    id: apiResponse.customer?.id || "",
    name: apiResponse.customer?.name || "Unknown Customer",
    // ... more fallbacks
  },
  // ... more fallbacks
};
```

---

### 4. **Previous Orders Mapping** (Lines 192-234)
**Location**: `src/app/view-order/page.tsx` - `fetchOrderData()` try block

**Fallback Values Used**:
- **Order Number**: `#${sale.id.slice(-8).toUpperCase()}` (derived from sale ID)
- **Order Date**: `new Date(sale.createdAt).toLocaleString()` (formatted from createdAt)
- **Tracking ID**: `TRK${sale.id.slice(-6).toUpperCase()}` (derived from sale ID)
- **Payment Method**: Falls back to `orderData.paymentMethod` or `"Bank Transfer"` if missing
- **Payment Type**: Determined from payment status (`"Full Payment"` if COMPLETED, else `"Part Payment"`)
- **Product Name**: `"Unknown Product"` if missing
- **Product Image**: Empty string if missing
- **Order Type**: Hardcoded `"Pick Up"` for all previous orders
- **Item Status**: Hardcoded `"Completed"` for all previous order items
- **Warehouse Number**: `undefined` for all previous order items

**Code Reference**:
```typescript
// Lines 192-234
const previousOrdersData: Order[] = customerSales
  .filter((sale) => sale.id !== finalOrderId)
  .map((sale) => {
    // ... mapping with fallbacks
  });
```

---

## 🟠 **HARDCODED/DERIVED DATA** (Not from backend)

### 5. **Product Images** (Lines 531-551)
**Location**: `src/app/view-order/page.tsx` - `getTireBrandImage()` function

**Hardcoded Brand Images**:
- Maps product names to hardcoded image paths:
  - Michelin → `/images/michelin.png`
  - Bridgestone → `/images/Bridgestone.png`
  - Continental → `/images/continental.png`
  - Goodyear → `/images/goodyear.png`
  - Dunlop → `/images/dunlop.png`
  - Pirelli → `/images/pirelli.png`
  - Hankook → `/images/hankook.png`
  - Maxxis → `/images/maxxis.png`
  - Firestone → `/images/firestone.png`
  - Yokohama → `/images/yokohama.png`
- **Default**: Falls back to `/images/michelin.png` if brand not found

**Code Reference**:
```typescript
// Lines 531-551
const getTireBrandImage = (productName: string) => {
  const brandImages: Record<string, string> = {
    "Michelin": "/images/michelin.png",
    // ... more brands
  };
  // ... extraction logic
  return brand ? brandImages[brand] : "/images/michelin.png";
};
```

---

### 6. **Product Brand Display** (Line 1184)
**Location**: `src/app/view-order/page.tsx` - Order items table

**Derived Data**:
- **Brand Name**: Extracted from product name using `item.productName.split(' ')[0]`
- Example: "Michelin Pilot Sport 4" → "Michelin Brand"

**Code Reference**:
```typescript
// Line 1184
{item.productName.split(' ')[0]} Brand
```

---

### 7. **Item Status Changes** (Lines 446-473)
**Location**: `src/app/view-order/page.tsx` - `handleItemStatusChange()` function

**Local Storage Only**:
- Item status changes are stored in `localStorage` only
- **NOT** persisted to backend
- Key format: `${order.id}-item-${itemIndex}`

**Code Reference**:
```typescript
// Lines 446-473
const handleItemStatusChange = (itemIndex: number, newStatus: string) => {
  // ... updates local state
  const itemStatusChanges = JSON.parse(localStorage.getItem('itemStatusChanges') || '{}');
  const itemKey = `${order.id}-item-${itemIndex}`;
  itemStatusChanges[itemKey] = newStatus;
  localStorage.setItem('itemStatusChanges', JSON.stringify(itemStatusChanges));
  // Note: Comment says "In a real app, you would make an API call to update the item status"
};
```

---

### 8. **Order Status Changes** (Lines 475-514)
**Location**: `src/app/view-order/page.tsx` - `handleStatusChange()` function

**Partial Backend Integration**:
- ✅ **Calls API**: `updateOrderStatus(order.id, backendStatus)` (Line 490)
- ⚠️ **Also stores in localStorage**: For persistence across page refreshes (Lines 497-499)
- Status mapping: Frontend status → Backend status
  - "Pending" → "PENDING"
  - "Completed" → "COMPLETED"
  - "In-Progress" → "PENDING"
  - "Cancelled"/"Canceled" → "CANCELLED"

**Code Reference**:
```typescript
// Lines 475-514
const handleStatusChange = async (newStatus: string) => {
  // ... API call
  await updateOrderStatus(order.id, backendStatus);
  // ... also stores in localStorage
  const statusChanges = JSON.parse(localStorage.getItem('orderStatusChanges') || '{}');
  statusChanges[order.id] = newStatus;
  localStorage.setItem('orderStatusChanges', JSON.stringify(statusChanges));
};
```

---

## ✅ **DATA FROM BACKEND** (Working correctly)

### 9. **Sale Details** (Lines 266-283)
**Location**: `src/app/view-order/page.tsx` - `fetchSaleDetails()` function

**Backend Data**:
- ✅ Fetches from `getSaleById(finalOrderId)`
- ✅ Payment status
- ✅ Outstanding balance
- ✅ Payment history (`saleDetails.payments`)
- ✅ Approval trail (`saleDetails.metadata.approvalTrail`)
- ✅ Discount information
- ✅ Invoice settings

**No Fallback**: If API fails, `saleDetails` remains `null` and payment sections don't display

---

### 10. **Payment Actions** (Lines 289-406)
**Location**: `src/app/view-order/page.tsx` - Payment action handlers

**Backend Integration**:
- ✅ `approveSalePayment()` - Calls API
- ✅ `querySalePayment()` - Calls API
- ✅ `rejectSalePayment()` - Calls API
- ✅ `addSalePayment()` - Calls API
- ✅ All actions refresh `saleDetails` after completion

---

## 📊 **Summary Table**

| Data Section | Backend API | Fallback/Dummy | Status |
|-------------|-------------|----------------|--------|
| **Main Order Data** | `getOrderById()` | ✅ `OrderDataService.generateOrder()` | ⚠️ Fallback exists |
| **Previous Orders** | `getSalesByCustomer()` | ✅ `OrderDataService.generatePreviousOrders()` | ⚠️ Fallback exists |
| **Sale Details** | `getSaleById()` | ❌ No fallback (shows null) | ✅ No dummy data |
| **Payment History** | Via `getSaleById()` | ❌ No fallback | ✅ No dummy data |
| **Approval Trail** | Via `getSaleById()` | ❌ No fallback | ✅ No dummy data |
| **Order Status Update** | `updateOrderStatus()` | ⚠️ Also uses localStorage | ✅ API works |
| **Item Status Update** | ❌ No API call | ✅ localStorage only | 🔴 Not persisted |
| **Product Images** | ❌ Not from backend | ✅ Hardcoded brand images | 🟠 Hardcoded |
| **Product Brand** | ❌ Not from backend | ✅ Derived from name | 🟠 Derived |

---

## 🎯 **Recommendations**

### **High Priority** (Backend API Required)
1. **Item Status Updates**: Create API endpoint to update individual item statuses
   - Endpoint: `PATCH /api/ceeone/pharma/sales/{saleId}/items/{itemId}/status`
   - Remove localStorage-only storage

2. **Product Images**: Backend should return product image URLs
   - Add `image` or `imageUrl` field to product data
   - Remove hardcoded brand image mapping

### **Medium Priority** (Improve Fallbacks)
3. **Order Data Fallback**: Instead of generating dummy data, show error message
   - "Failed to load order. Please try again."
   - Remove `OrderDataService.generateOrder()` fallback

4. **Previous Orders Fallback**: Show empty state instead of dummy data
   - "No previous orders found" message
   - Remove `OrderDataService.generatePreviousOrders()` fallback

### **Low Priority** (Nice to Have)
5. **Product Brand**: Backend should return brand as separate field
   - Add `brand` field to product data
   - Remove name parsing logic

6. **Order Status**: Remove localStorage persistence
   - Backend should be source of truth
   - Only use localStorage for optimistic updates

---

## 🔍 **How to Test**

### Test Dummy Data Fallbacks:
1. **Stop backend server**
2. Navigate to `/view-order?id=any-id`
3. **Expected**: See dummy order data with hardcoded values

### Test Missing Data Fallbacks:
1. **Backend returns partial data** (missing fields)
2. Navigate to `/view-order?id=valid-id`
3. **Expected**: See fallback values (e.g., "Unknown Customer", "Cash", etc.)

### Test Backend Data:
1. **Backend running normally**
2. Navigate to `/view-order?id=valid-sale-id`
3. **Expected**: See real data from backend
4. **Check**: Payment history, approval trail should be real data

---

## 📝 **Notes**

- **Dummy data fallbacks** are only used when API calls **fail completely**
- **Fallback values** are used when API returns data but **fields are missing**
- **Hardcoded data** is always used regardless of backend (product images, brand extraction)
- **localStorage** is used for item status changes (not persisted to backend)


