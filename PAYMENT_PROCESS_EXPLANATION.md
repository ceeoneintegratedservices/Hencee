# Payment Process Explanation

This document explains how the payment system works in the CeeOne Pharma application, including payment creation, recording, approval workflows, and tracking.

---

## 📋 **Table of Contents**

1. [Payment Overview](#payment-overview)
2. [Payment Creation](#payment-creation)
3. [Payment Recording](#payment-recording)
4. [Payment Approval Workflow](#payment-approval-workflow)
5. [Payment Statuses](#payment-statuses)
6. [Payment Methods](#payment-methods)
7. [Payment History & Tracking](#payment-history--tracking)
8. [Approval Trail](#approval-trail)
9. [User Roles & Permissions](#user-roles--permissions)
10. [API Endpoints](#api-endpoints)

---

## 🎯 **Payment Overview**

The payment system in CeeOne Pharma is integrated with the sales/orders system. Each sale (order) can have:
- **One or more payments** recorded against it
- **Payment status** (PENDING, COMPLETED, FAILED, REFUNDED)
- **Payment method** (Cash, Card, Bank Transfer, Cheque, Mobile Money)
- **Approval workflow** for payment verification
- **Payment history** tracking all payment attempts
- **Approval trail** logging all approval actions

---

## 💰 **Payment Creation**

### **1. During Order Creation**

When creating a new order through the `CreateOrderModal`, payment information can be included:

**Location**: `src/components/CreateOrderModal.tsx` (Lines 700-738)

**Payment Fields**:
- **Payment Method**: Cash, Card, Bank Transfer, Cheque, Mobile Money
- **Payment Status**: PENDING or COMPLETED
- **Payment Amount**: Amount received (required if status is COMPLETED)
- **Payment Reference**: Optional reference number
- **Method-Specific Fields**:
  - **Bank Transfer**: `senderName`, `transactionReference`
  - **Cheque**: `chequeNumber`, `accountName`

**Payment Status Logic**:
- If "Full Payment" selected → Status = `COMPLETED`
- If "Part Payment" selected → Status = `PENDING`
- If payment method provided but status is `COMPLETED` → Amount is required

**API Call**:
```typescript
POST /api/ceeone/pharma/sales
Body: {
  customerId: string,
  items: [...],
  payment: {
    method: "cash" | "card" | "bank_transfer" | "cheque" | "mobile_money",
    status: "PENDING" | "COMPLETED",
    amount: number,
    reference?: string,
    senderName?: string,        // For bank_transfer
    transactionReference?: string, // For bank_transfer
    chequeNumber?: string,       // For cheque
    accountName?: string         // For cheque
  }
}
```

**Result**: Sale is created with initial payment (if provided)

---

### **2. After Order Creation**

Payments can be added to existing orders through the "Add Payment" feature on the view-order page.

**Location**: `src/app/view-order/page.tsx` (Lines 356-406)

**Process**:
1. User clicks "Add Payment" button (visible to Admin/Managing Director)
2. Modal opens with payment form
3. User fills in:
   - Amount received
   - Payment method
   - Payment status (PENDING or COMPLETED)
   - Reference (optional)
   - Method-specific fields (if applicable)
4. Payment is recorded via API

**API Call**:
```typescript
POST /api/ceeone/pharma/sales/{saleId}/payments
Body: {
  amount: number,
  method: PaymentMethod,
  status: PaymentStatus,
  reference?: string,
  senderName?: string,
  transactionReference?: string,
  chequeNumber?: string,
  accountName?: string
}
```

**Result**: New payment record added to sale's payment history

---

## 📝 **Payment Recording**

### **Payment Data Structure**

**Interface**: `SalePayment` (from `src/services/sales.ts`)

```typescript
interface SalePayment {
  id: string;
  method: "cash" | "card" | "bank_transfer" | "cheque" | "mobile_money";
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  amount: number;
  reference?: string;
  senderName?: string;           // Bank transfer sender
  transactionReference?: string; // Bank transfer reference
  chequeNumber?: string;         // Cheque number
  accountName?: string;          // Cheque account name
  createdAt: string;
  updatedAt: string;
}
```

### **Payment Methods & Required Fields**

| Method | Required Fields | Optional Fields |
|--------|----------------|-----------------|
| **Cash** | `amount`, `method`, `status` | `reference` |
| **Card** | `amount`, `method`, `status` | `reference` |
| **Bank Transfer** | `amount`, `method`, `status` | `reference`, `senderName`, `transactionReference` |
| **Cheque** | `amount`, `method`, `status` | `reference`, `chequeNumber`, `accountName` |
| **Mobile Money** | `amount`, `method`, `status` | `reference` |

---

## ✅ **Payment Approval Workflow**

The payment approval workflow allows authorized users (Admin/Managing Director) to verify and approve payments.

### **1. Approve Payment**

**Who Can Approve**: Admin or Managing Director

**Location**: `src/app/view-order/page.tsx` (Lines 289-312)

**Process**:
1. Navigate to order with `PENDING` payment status
2. Click "Approve Payment" button
3. Enter:
   - **Amount Paid**: Amount actually received (required)
   - **Approval Note**: Optional note for approval trail
4. Submit approval

**API Call**:
```typescript
POST /api/ceeone/pharma/sales/{saleId}/payments/approve
Body: {
  amountPaid: number,
  note?: string
}
```

**Result**:
- Payment status changes to `COMPLETED`
- Outstanding balance is recalculated
- Approval action logged in approval trail
- Button becomes disabled (already approved)

**Validation**:
- Amount must be greater than zero
- Payment must be in `PENDING` status (cannot approve already completed payments)

---

### **2. Query Payment**

**Who Can Query**: Admin only

**Location**: `src/app/view-order/page.tsx` (Lines 314-333)

**Process**:
1. Click "Query Payment" button
2. Enter query note explaining the issue
3. Submit query

**API Call**:
```typescript
POST /api/ceeone/pharma/sales/{saleId}/payments/query
Body: {
  note: string
}
```

**Result**:
- Payment is flagged for review
- Query action logged in approval trail
- Payment status may remain `PENDING` or change based on backend logic

**Use Case**: When payment details need clarification or verification

---

### **3. Reject Payment**

**Who Can Reject**: Managing Director only

**Location**: `src/app/view-order/page.tsx` (Lines 335-354)

**Process**:
1. Click "Reject Payment" button
2. Enter rejection note explaining the reason
3. Submit rejection

**API Call**:
```typescript
POST /api/ceeone/pharma/sales/{saleId}/payments/reject
Body: {
  note: string
}
```

**Result**:
- Payment is rejected
- Rejection action logged in approval trail
- Payment status may change to `FAILED` based on backend logic

**Use Case**: When payment is invalid, fraudulent, or cannot be verified

---

## 📊 **Payment Statuses**

### **Status Types**

**Type**: `PaymentStatus` (from `src/services/sales.ts`)

```typescript
type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
```

### **Status Meanings**

| Status | Description | When Used |
|--------|-------------|-----------|
| **PENDING** | Payment recorded but not yet verified/completed | Initial payment recording, partial payments, awaiting approval |
| **COMPLETED** | Payment verified and completed | After approval, full payment received |
| **FAILED** | Payment failed or rejected | Payment rejection, invalid payment |
| **REFUNDED** | Payment was refunded | Refund processed |

### **Status Badge Colors**

**Location**: `src/app/view-order/page.tsx` (Lines 129-141)

- **COMPLETED**: Green badge (`bg-green-100 text-green-800`)
- **FAILED**: Red badge (`bg-red-100 text-red-800`)
- **REFUNDED**: Purple badge (`bg-purple-100 text-purple-800`)
- **PENDING**: Orange badge (`bg-orange-100 text-orange-800`)

---

## 💳 **Payment Methods**

### **Supported Methods**

**Type**: `PaymentMethod` (from `src/services/sales.ts`)

```typescript
type PaymentMethod = 
  | "cash"
  | "card"
  | "bank_transfer"
  | "cheque"
  | "mobile_money";
```

### **Method Display Labels**

**Location**: `src/app/view-order/page.tsx` (Lines 26-32, 41-45)

| Method Value | Display Label |
|--------------|---------------|
| `cash` | Cash |
| `card` | Card |
| `bank_transfer` | Bank Transfer |
| `cheque` | Cheque |
| `mobile_money` | Mobile Money |

---

## 📜 **Payment History & Tracking**

### **Payment History Display**

**Location**: `src/app/view-order/page.tsx` (Lines 1293-1385)

**Data Source**: `saleDetails.payments` array (fetched from `getSaleById()`)

**Displayed Information**:
- **Method**: Payment method used
- **Amount**: Payment amount
- **Status**: Current payment status (with color badge)
- **Reference**: Payment reference number
- **Sender/Account**: Sender name (bank transfer) or account name (cheque)
- **Transaction Details**: Transaction reference (bank transfer) or cheque number
- **Date**: Payment creation timestamp

**Features**:
- All payments for a sale are displayed in a table
- Payments are sorted by creation date (newest first)
- Empty state shown if no payments recorded

---

## 🔍 **Approval Trail**

### **Approval Trail Display**

**Location**: `src/app/view-order/page.tsx` (Lines 1387-1464)

**Data Source**: `saleDetails.metadata.approvalTrail` array

**Displayed Information**:
- **Action**: Type of action (APPROVE, QUERY, REJECT, STATUS_UPDATE)
- **Role**: Role of user who performed the action
- **Status**: Payment status after action
- **Amount**: Amount paid (for approvals)
- **Note**: Note/comment from the action
- **Timestamp**: When the action was performed

**Features**:
- All approval actions are logged chronologically
- Trail is sorted by timestamp (newest first)
- Shows complete audit history of payment actions

### **Approval Trail Entry Structure**

**Interface**: `ApprovalTrailEntry` (from `src/services/sales.ts`)

```typescript
interface ApprovalTrailEntry {
  action: "APPROVE" | "QUERY" | "REJECT" | "STATUS_UPDATE" | string;
  role?: string;
  status?: PaymentStatus | string;
  amountPaid?: number;
  note?: string;
  timestamp?: string;
  performedBy?: string;
}
```

---

## 👥 **User Roles & Permissions**

### **Payment Action Permissions**

**Location**: `src/app/view-order/page.tsx` (Lines 95-102)

| Action | Required Role | Permission Check |
|--------|---------------|------------------|
| **Approve Payment** | Admin OR Managing Director | `hasRole(ROLES.ADMIN) || hasRole(ROLES.MANAGING_DIRECTOR)` |
| **Query Payment** | Admin only | `hasRole(ROLES.ADMIN)` |
| **Reject Payment** | Managing Director only | `hasRole(ROLES.MANAGING_DIRECTOR)` |
| **Add Payment** | Admin OR Managing Director | `hasRole(ROLES.ADMIN) || hasRole(ROLES.MANAGING_DIRECTOR)` |

### **UI Visibility**

- Payment action buttons are only visible to authorized users
- "Approve Payment" button is disabled if payment is already `COMPLETED`
- Buttons are conditionally rendered based on role checks

---

## 🔌 **API Endpoints**

### **Payment-Related Endpoints**

**Base URL**: `/api/ceeone/pharma`

| Endpoint | Method | Purpose | Location |
|----------|--------|---------|----------|
| `/sales` | POST | Create sale with payment | `createSale()` |
| `/sales/{id}` | GET | Get sale with payment details | `getSaleById()` |
| `/sales/{id}/payments` | POST | Add payment to sale | `addSalePayment()` |
| `/sales/{id}/payments/approve` | POST | Approve payment | `approveSalePayment()` |
| `/sales/{id}/payments/query` | POST | Query payment | `querySalePayment()` |
| `/sales/{id}/payments/reject` | POST | Reject payment | `rejectSalePayment()` |
| `/sales/{id}/invoice` | GET | Download invoice | `downloadSaleInvoice()` |

### **Payment Service Functions**

**File**: `src/services/sales.ts`

| Function | Purpose |
|----------|--------|
| `createSale()` | Create sale with optional initial payment |
| `getSaleById()` | Fetch sale details including payments and approval trail |
| `addSalePayment()` | Record additional payment for a sale |
| `approveSalePayment()` | Approve a pending payment |
| `querySalePayment()` | Query/flag a payment for review |
| `rejectSalePayment()` | Reject a payment |

---

## 🔄 **Payment Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    ORDER CREATION                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Create Order Modal                                    │  │
│  │  - Select Customer                                     │  │
│  │  - Add Products                                        │  │
│  │  - [Optional] Add Payment Info                        │  │
│  │    • Method: Cash/Card/Bank Transfer/etc             │  │
│  │    • Status: PENDING or COMPLETED                     │  │
│  │    • Amount: Payment amount                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                    │
│              POST /api/ceeone/pharma/sales                  │
│                         ↓                                    │
│              Sale Created with Payment                      │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT STATUS                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   PENDING     │  │  COMPLETED   │  │    FAILED    │     │
│  │               │  │              │  │              │     │
│  │ Awaiting      │  │ Approved &   │  │ Rejected or  │     │
│  │ Approval      │  │ Verified     │  │ Invalid      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              PAYMENT MANAGEMENT ACTIONS                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Add Payment (Admin/MD)                               │  │
│  │  - Record additional payment                          │  │
│  │  - Status: PENDING or COMPLETED                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Approve Payment (Admin/MD)                           │  │
│  │  - Verify payment received                           │  │
│  │  - Update status to COMPLETED                         │  │
│  │  - Log in approval trail                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Query Payment (Admin)                                │  │
│  │  - Flag for review                                    │  │
│  │  - Add query note                                    │  │
│  │  - Log in approval trail                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Reject Payment (MD)                                  │  │
│  │  - Reject invalid payment                            │  │
│  │  - Add rejection note                                │  │
│  │  - Update status to FAILED                           │  │
│  │  - Log in approval trail                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT TRACKING                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Payment History                                      │  │
│  │  - All payments for the sale                         │  │
│  │  - Method, amount, status, date                      │  │
│  │  - Transaction references                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Approval Trail                                       │  │
│  │  - All approval actions                              │  │
│  │  - Who approved/rejected/queried                     │  │
│  │  - When and why                                      │  │
│  │  - Complete audit log                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Outstanding Balance                                  │  │
│  │  - Calculated from total - payments                  │  │
│  │  - Updated after each payment action                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 **Key Features**

### **1. Multiple Payments Per Sale**
- A sale can have multiple payment records
- Each payment can have different methods, amounts, and statuses
- Outstanding balance is calculated from total amount minus all completed payments

### **2. Payment Approval Workflow**
- Payments start as `PENDING` (unless marked `COMPLETED` during creation)
- Admin/Managing Director can approve payments
- Admin can query payments for clarification
- Managing Director can reject invalid payments

### **3. Complete Audit Trail**
- All payment actions are logged in the approval trail
- Shows who did what, when, and why
- Provides complete payment history for auditing

### **4. Method-Specific Fields**
- Bank transfers capture sender name and transaction reference
- Cheques capture cheque number and account name
- All methods support optional reference numbers

### **5. Status Management**
- Payment status reflects current state
- Status changes are tracked in approval trail
- UI reflects status with color-coded badges

---

## 🎯 **Best Practices**

1. **Always record payments immediately** when received
2. **Use PENDING status** until payment is verified
3. **Approve payments promptly** after verification
4. **Add notes** to approval actions for clarity
5. **Query payments** when details need clarification
6. **Reject payments** only when invalid or fraudulent
7. **Check payment history** before adding duplicate payments
8. **Monitor outstanding balance** to track payment progress

---

## 🔍 **Common Scenarios**

### **Scenario 1: Full Payment at Order Creation**
1. Create order with "Full Payment" selected
2. Payment status automatically set to `COMPLETED`
3. Amount equals order total
4. Outstanding balance = 0

### **Scenario 2: Partial Payment**
1. Create order with "Part Payment" selected
2. Payment status = `PENDING`
3. Amount < order total
4. Outstanding balance = total - amount
5. Later: Add additional payments or approve existing payment

### **Scenario 3: Bank Transfer Payment**
1. Record payment with method = "bank_transfer"
2. Enter sender name and transaction reference
3. Status = `PENDING` until verified
4. Admin approves after verifying bank statement
5. Status changes to `COMPLETED`

### **Scenario 4: Payment Query**
1. Payment recorded but details unclear
2. Admin queries payment with note
3. Payment flagged for review
4. After clarification, payment is approved or rejected

---

## 📚 **Related Documentation**

- `PAYMENT_TESTING_GUIDE.md` - How to test payment functionalities
- `VIEW_ORDER_DUMMY_DATA_ANALYSIS.md` - What data comes from backend
- `src/services/sales.ts` - Payment service functions
- `src/app/view-order/page.tsx` - Payment UI and handlers
- `src/components/CreateOrderModal.tsx` - Payment creation during order

---

## ❓ **FAQ**

**Q: Can I add multiple payments to one order?**  
A: Yes, you can add multiple payments using the "Add Payment" button.

**Q: Who can approve payments?**  
A: Admin and Managing Director can approve payments.

**Q: What's the difference between query and reject?**  
A: Query flags a payment for review/clarification. Reject marks it as invalid/failed.

**Q: Can I approve an already completed payment?**  
A: No, the approve button is disabled for completed payments.

**Q: How is outstanding balance calculated?**  
A: Outstanding balance = Total order amount - Sum of all COMPLETED payments.

**Q: Can I edit a payment after recording it?**  
A: Currently, payments cannot be edited. You would need to add a new payment or contact support.

---

**Last Updated**: December 2024  
**Version**: 1.0

