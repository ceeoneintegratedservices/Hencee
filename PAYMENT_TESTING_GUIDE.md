# Payment Testing Guide

This guide covers how to test payment functionality in the CeeoneApp-pharma application.

---

## Prerequisites

1. **Backend Running**: Ensure your backend API is running on `http://localhost:5000`
2. **Frontend Running**: Start your Next.js app with `yarn dev` or `npm run dev`
3. **User Account**: Login with an admin or managing director account (for payment approval permissions)
4. **Browser DevTools**: Open Network tab to monitor API calls

---

## Payment Flow Overview

Payments in this application are tied to **Sales/Orders**. The payment workflow is:

1. **Create Order** → Order is created with payment method and status
2. **View Order** → Access payment details and history
3. **Record Payment** → Add payment records (for partial payments, additional payments)
4. **Approve/Query/Reject Payment** → Admin/Managing Director actions

---

## 1. Testing Payment Creation (During Order Creation)

### Access the Feature
1. Navigate to: `http://localhost:3000/orders`
2. Click "Create Order" button

### Test Scenarios

#### Test 1: Create Order with Full Payment (Cash)
- **Steps**:
  1. Select a customer
  2. Add products to the order
  3. Select payment method: "Cash"
  4. Select payment type: "Full Payment"
  5. Complete the order
- **Expected**: 
  - Order created successfully
  - Payment status shows as "COMPLETED" or "PENDING" depending on backend logic
  - Payment method is recorded as "Cash"
- **Check**: Network tab shows `POST /api/ceeone/pharma/sales` with payment details

#### Test 2: Create Order with Part Payment (Bank Transfer)
- **Steps**:
  1. Select a customer
  2. Add products to the order
  3. Select payment method: "Bank Transfer"
  4. Select payment type: "Part Payment"
  5. Enter payment amount (less than total)
  6. Complete the order
- **Expected**: 
  - Order created with partial payment
  - Payment status shows as "PENDING" or "PARTIAL"
  - Outstanding balance is calculated
- **Check**: Network tab shows payment amount in request body

#### Test 3: Create Order with Credit Payment
- **Steps**:
  1. Select a customer (with credit enabled)
  2. Add products
  3. Select payment method: "Credit"
  4. Complete the order
- **Expected**: 
  - Order created on credit
  - Payment status shows as "PENDING" or "CREDIT"
  - Customer's outstanding balance increases
- **Check**: Customer balance updates in database

---

## 2. Testing Payment Viewing (Order Details Page)

### Access the Feature
1. Navigate to: `http://localhost:3000/orders`
2. Click on any order to view details
3. Or navigate to: `http://localhost:3000/view-order?id=<order-id>`

### Test Scenarios

#### Test 1: View Payment Information
- **Expected**: 
  - Payment method displayed (Cash, Card, Bank Transfer, etc.)
  - Payment status badge shown (Pending, Completed, Failed)
  - Payment amount displayed
  - Payment history table visible (if multiple payments exist)

#### Test 2: View Payment History
- **Expected**: 
  - Table shows all payment records for the order
  - Columns: Method, Amount, Status, Reference, Sender Name, Transaction Reference, Date
  - Empty state if no payments recorded yet

---

## 3. Testing Payment Recording (Add Additional Payment)

### Access the Feature
1. Navigate to an order details page
2. Click "Add Payment" button (visible to Admin/Managing Director)

### Test Scenarios

#### Test 1: Record Cash Payment
- **Steps**:
  1. Click "Add Payment"
  2. Enter amount
  3. Select method: "Cash"
  4. Select status: "COMPLETED"
  5. Click "Record Payment"
- **Expected**: 
  - Success notification: "Payment Recorded"
  - Payment appears in payment history table
  - Order total updates (if applicable)
- **Check**: Network tab shows `POST /api/ceeone/pharma/sales/{id}/payments`

#### Test 2: Record Bank Transfer Payment
- **Steps**:
  1. Click "Add Payment"
  2. Enter amount
  3. Select method: "Bank Transfer"
  4. Enter sender name
  5. Enter transaction reference
  6. Select status: "PENDING" or "COMPLETED"
  7. Click "Record Payment"
- **Expected**: 
  - Payment recorded with all details
  - Sender name and transaction reference visible in history
- **Check**: Request body includes `senderName` and `transactionReference`

#### Test 3: Record Cheque Payment
- **Steps**:
  1. Click "Add Payment"
  2. Enter amount
  3. Select method: "Cheque"
  4. Enter cheque number
  5. Enter account name
  6. Select status: "PENDING"
  7. Click "Record Payment"
- **Expected**: 
  - Payment recorded with cheque details
  - Cheque number and account name visible in history
- **Check**: Request body includes `chequeNumber` and `accountName`

#### Test 4: Invalid Amount (Zero/Negative)
- **Steps**:
  1. Enter 0 or negative amount
  2. Try to submit
- **Expected**: 
  - Error: "Please enter the payment amount (greater than zero)"
  - Submit prevented

#### Test 5: Missing Required Fields
- **Steps**:
  1. Leave amount empty
  2. Try to submit
- **Expected**: 
  - Submit button disabled or error shown
  - Form validation prevents submission

---

## 4. Testing Payment Approval (Admin/Managing Director)

### Access the Feature
1. Login as Admin or Managing Director
2. Navigate to an order with pending payment
3. Click "Approve Payment" button

### Test Scenarios

#### Test 1: Approve Pending Payment
- **Steps**:
  1. Find order with payment status "PENDING"
  2. Click "Approve Payment"
  3. Confirm approval
- **Expected**: 
  - Success notification: "Payment Approved"
  - Payment status changes to "COMPLETED"
  - Button becomes disabled (already approved)
- **Check**: Network tab shows `POST /api/ceeone/pharma/sales/{id}/payments/approve`

#### Test 2: Approve Already Approved Payment
- **Steps**:
  1. Find order with payment status "COMPLETED"
  2. Try to click "Approve Payment"
- **Expected**: 
  - Button is disabled
  - Cannot approve already completed payment

---

## 5. Testing Payment Query (Admin Only)

### Access the Feature
1. Login as Admin
2. Navigate to an order with payment
3. Click "Query Payment" button

### Test Scenarios

#### Test 1: Query Payment with Reason
- **Steps**:
  1. Click "Query Payment"
  2. Enter query reason: "Need to verify transaction reference"
  3. Click "Query Payment"
- **Expected**: 
  - Success notification: "Payment Queried"
  - Payment flagged for review
  - Query note stored
- **Check**: Network tab shows `POST /api/ceeone/pharma/sales/{id}/payments/query` with note

#### Test 2: Query Without Reason
- **Steps**:
  1. Click "Query Payment"
  2. Leave reason empty
  3. Try to submit
- **Expected**: 
  - Error or validation prevents submission
  - Reason is required

---

## 6. Testing Payment Rejection (Managing Director Only)

### Access the Feature
1. Login as Managing Director
2. Navigate to an order with payment
3. Click "Reject Payment" button

### Test Scenarios

#### Test 1: Reject Payment with Reason
- **Steps**:
  1. Click "Reject Payment"
  2. Enter rejection reason: "Transaction reference not found"
  3. Click "Reject Payment"
- **Expected**: 
  - Success notification: "Payment Rejected"
  - Payment status changes to "REJECTED" or "FAILED"
  - Rejection reason stored
- **Check**: Network tab shows `POST /api/ceeone/pharma/sales/{id}/payments/reject` with reason

#### Test 2: Reject Without Reason
- **Steps**:
  1. Click "Reject Payment"
  2. Leave reason empty
  3. Try to submit
- **Expected**: 
  - Error: "Please provide a rejection reason"
  - Submit prevented

---

## 7. Testing Payment Methods

### Available Payment Methods
- **Cash**: Direct cash payment
- **Card**: Card payment (debit/credit card)
- **Bank Transfer**: Bank transfer payment
- **Cheque**: Cheque payment
- **Mobile Money**: Mobile money payment (e.g., M-Pesa, MTN Mobile Money)
- **Credit**: Credit payment (customer owes)

### Test Each Method
1. Create order with each payment method
2. Verify method is saved correctly
3. Verify method displays correctly in order details
4. Verify method appears in payment history

---

## 8. Testing Payment Statuses

### Available Payment Statuses
- **PENDING**: Payment is pending approval/verification
- **COMPLETED**: Payment is completed and approved
- **FAILED**: Payment failed or was rejected
- **REFUNDED**: Payment was refunded

### Test Status Transitions
1. **PENDING → COMPLETED**: Approve payment
2. **PENDING → FAILED**: Reject payment
3. **COMPLETED → REFUNDED**: Process refund (if available)

---

## 9. Backend API Testing (Using Postman/Thunder Client)

### Test Payment Endpoints

```bash
# Get Payments
GET http://localhost:5000/api/ceeone/pharma/payments?page=1&limit=10
Headers: Authorization: Bearer <token>

# Get Payment by ID
GET http://localhost:5000/api/ceeone/pharma/payments/{paymentId}
Headers: Authorization: Bearer <token>

# Create Payment
POST http://localhost:5000/api/ceeone/pharma/payments
Headers: Authorization: Bearer <token>
Content-Type: application/json
Body: {
  "saleId": "sale-id-here",
  "amount": 1000.00,
  "method": "CASH",
  "status": "COMPLETED",
  "reference": "REF-12345"
}

# Update Payment Status
PUT http://localhost:5000/api/ceeone/pharma/payments/{paymentId}/status
Headers: Authorization: Bearer <token>
Content-Type: application/json
Body: {
  "status": "COMPLETED",
  "notes": "Payment verified"
}

# Get Payments by Sale
GET http://localhost:5000/api/ceeone/pharma/sales/{saleId}/payments
Headers: Authorization: Bearer <token>

# Approve Sale Payment
POST http://localhost:5000/api/ceeone/pharma/sales/{saleId}/payments/approve
Headers: Authorization: Bearer <token>
Body: {}

# Query Sale Payment
POST http://localhost:5000/api/ceeone/pharma/sales/{saleId}/payments/query
Headers: Authorization: Bearer <token>
Content-Type: application/json
Body: {
  "note": "Need to verify transaction reference"
}

# Reject Sale Payment
POST http://localhost:5000/api/ceeone/pharma/sales/{saleId}/payments/reject
Headers: Authorization: Bearer <token>
Content-Type: application/json
Body: {
  "note": "Transaction reference not found"
}

# Add Sale Payment
POST http://localhost:5000/api/ceeone/pharma/sales/{saleId}/payments
Headers: Authorization: Bearer <token>
Content-Type: application/json
Body: {
  "amount": 500.00,
  "method": "BANK_TRANSFER",
  "status": "PENDING",
  "senderName": "John Doe",
  "transactionReference": "TXN-12345"
}
```

---

## 10. Quick Test Checklist

### ✅ Payment Creation
- [ ] Can create order with Cash payment
- [ ] Can create order with Bank Transfer payment
- [ ] Can create order with Part Payment
- [ ] Can create order with Credit payment
- [ ] Payment method is saved correctly
- [ ] Payment status is set correctly

### ✅ Payment Viewing
- [ ] Payment details display correctly in order view
- [ ] Payment history table shows all payments
- [ ] Payment status badges display correctly
- [ ] Payment amounts format correctly (currency)

### ✅ Payment Recording
- [ ] Can add additional payment
- [ ] Can record Cash payment
- [ ] Can record Bank Transfer with sender name and reference
- [ ] Can record Cheque with cheque number and account name
- [ ] Amount validation works
- [ ] Required fields validation works

### ✅ Payment Approval
- [ ] Admin can approve payment
- [ ] Managing Director can approve payment
- [ ] Approval updates payment status
- [ ] Already approved payments cannot be approved again

### ✅ Payment Query
- [ ] Admin can query payment
- [ ] Query reason is required
- [ ] Query note is stored

### ✅ Payment Rejection
- [ ] Managing Director can reject payment
- [ ] Rejection reason is required
- [ ] Rejection updates payment status

### ✅ Integration
- [ ] Payment status updates reflect in order list
- [ ] Payment history persists across page refreshes
- [ ] Notifications appear correctly
- [ ] Error handling works
- [ ] Loading states show

---

## 11. Common Issues and Troubleshooting

### Issue: Payment not showing in order
- **Check**: Verify API endpoint is correct
- **Check**: Verify payment was created successfully
- **Check**: Check browser console for errors

### Issue: Cannot approve payment
- **Check**: Verify user has admin/managing director permissions
- **Check**: Verify payment status is PENDING
- **Check**: Check network tab for API errors

### Issue: Payment status not updating
- **Check**: Verify API call succeeded
- **Check**: Refresh page to see updated status
- **Check**: Check backend logs for errors

### Issue: Payment amount calculation incorrect
- **Check**: Verify order total calculation
- **Check**: Verify partial payment amounts sum correctly
- **Check**: Check for rounding errors

---

## 12. Payment Testing Scenarios Summary

| Scenario | Payment Method | Payment Type | Expected Status | Who Can Test |
|----------|---------------|--------------|-----------------|--------------|
| Full Cash Payment | Cash | Full Payment | COMPLETED | All Users |
| Part Bank Transfer | Bank Transfer | Part Payment | PENDING | All Users |
| Credit Order | Credit | Full Payment | PENDING | All Users |
| Add Cash Payment | Cash | Additional | COMPLETED | Admin/MD |
| Approve Payment | Any | Any | COMPLETED | Admin/MD |
| Query Payment | Any | Any | PENDING (flagged) | Admin |
| Reject Payment | Any | Any | FAILED | MD |

---

## Notes

- Payment testing requires backend API to be running
- Some payment features require specific user roles (Admin, Managing Director)
- Payment statuses may vary based on backend implementation
- Always check network tab for API errors during testing
- Payment history is tied to sales/orders, not standalone

