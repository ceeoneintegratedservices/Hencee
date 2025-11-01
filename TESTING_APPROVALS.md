# Testing Guide: Approval Systems

This guide covers how to test all three approval systems: Expense Approvals, Account Approvals, and Refund Request Approvals.

---

## Prerequisites

1. **Backend Running**: Ensure your backend API is running on `http://localhost:5000`
2. **Frontend Running**: Start your Next.js app with `npm run dev`
3. **User Account**: Login with an admin account (or account with approval permissions)
4. **Browser DevTools**: Open Network tab to monitor API calls

---

## 1. Testing Expense Approvals (Existing Feature)

### Access the Feature
1. Navigate to: `http://localhost:3000/approvals`
2. You should see the "Expense Approvals" tab (default active)

### Test Scenarios

#### Test 1: View Expense Approvals
- **Expected**: Page loads and displays expense approval items
- **Check**: 
  - Summary cards show totals (Total Items, Pending, Approved, Rejected)
  - Table/cards show expense requests
  - Loading state appears while fetching
  - Empty state shows if no approvals exist

#### Test 2: Filter Expense Approvals
- **Steps**:
  1. Use the search bar to filter by title/description
  2. Click "Status" filter dropdown
  3. Select different statuses (All, Pending, Approved, Rejected)
  4. Apply date filter
- **Expected**: List updates based on filters
- **Check**: Network tab shows API calls with correct query parameters

#### Test 3: Approve an Expense
- **Steps**:
  1. Find a pending expense approval
  2. Click "Approve" button
  3. Wait for success notification
- **Expected**: 
  - Success message appears
  - Item status changes to "Approved"
  - Item moves out of pending list
- **Check**: Network tab shows `POST /approvals/{id}/approve`

#### Test 4: Reject an Expense
- **Steps**:
  1. Find a pending expense approval
  2. Click "Reject" button
  3. Enter rejection reason in prompt
  4. Submit
- **Expected**: 
  - Success message appears
  - Item status changes to "Rejected"
  - Rejection reason is stored
- **Check**: Network tab shows `POST /approvals/{id}/reject` with reason

#### Test 5: Mark Expense as Paid
- **Steps**:
  1. Find an approved expense
  2. If available, click "Mark as Paid"
- **Expected**: Status updates to "Paid"
- **Check**: Network tab shows `POST /approvals/{id}/mark-paid`

---

## 2. Testing Account Approvals (New Feature)

### Access the Feature
1. Navigate to: `http://localhost:3000/approvals`
2. Click the "Account Approvals" tab

### Test Scenarios

#### Test 1: View Pending Accounts
- **Expected**: 
  - Page loads account approvals tab
  - Shows list of pending account approvals
  - Displays: Name, Email, Phone, Role, Request Date
- **Check**: 
  - Network tab shows `GET /approvals/accounts/pending`
  - Loading spinner appears while fetching
  - Empty state shows if no pending accounts

#### Test 2: Approve an Account
- **Steps**:
  1. Find a pending account approval
  2. Click green "Approve" button
  3. Wait for success notification
- **Expected**: 
  - Success notification: "Account approved successfully"
  - Account disappears from pending list
  - User account becomes active/approved
- **Check**: 
  - Network tab shows `POST /approvals/accounts/{userId}/approve`
  - Response returns approved account data

#### Test 3: Reject an Account
- **Steps**:
  1. Find a pending account approval
  2. Click red "Reject" button
  3. Rejection dialog appears
  4. Enter rejection reason (required)
  5. Click "Reject Account"
- **Expected**: 
  - Success notification: "Account rejected"
  - Dialog closes
  - Account disappears from pending list
  - Rejection reason is stored
- **Check**: 
  - Network tab shows `POST /approvals/accounts/{userId}/reject`
  - Request body includes `userId` and `reason`

#### Test 4: Reject Without Reason
- **Steps**:
  1. Click "Reject" button
  2. Don't enter a reason
  3. Try to submit
- **Expected**: 
  - Error message: "Please provide a rejection reason"
  - Submit button is disabled
  - Dialog stays open

#### Test 5: Pagination
- **Steps**:
  1. If there are more than 10 pending accounts
  2. Use "Previous" and "Next" buttons
- **Expected**: 
  - Page navigation works
  - Different accounts load
  - Page number updates
- **Check**: Network tab shows pagination query params (`?page=2&limit=10`)

---

## 3. Testing Refund Request Approvals (New Feature)

### Access the Feature
1. Navigate to: `http://localhost:3000/approvals`
2. Click the "Refund Requests" tab

### Test Scenarios

#### Test 1: View Pending Refunds
- **Expected**: 
  - Page loads refund approvals tab
  - Shows list of pending refund requests
  - Displays: Amount, Sale ID, Reason, Requester, Date
- **Check**: 
  - Network tab shows `GET /approvals/refunds/pending`
  - Loading spinner appears
  - Empty state if no refunds

#### Test 2: Approve a Refund (Without Method/Reference)
- **Steps**:
  1. Find a pending refund request
  2. Click green "Approve" button
  3. Approve dialog appears
  4. Leave "Refund Method" and "Refund Reference" empty
  5. Click "Approve Refund"
- **Expected**: 
  - Success notification: "Refund approved successfully"
  - Refund disappears from pending list
  - Status changes to "Approved"
- **Check**: 
  - Network tab shows `POST /approvals/refunds/{id}/approve`
  - Request body may be empty or have undefined values

#### Test 3: Approve a Refund (With Method/Reference)
- **Steps**:
  1. Click "Approve" button
  2. Enter "Bank Transfer" in Refund Method
  3. Enter "REF-12345" in Refund Reference
  4. Click "Approve Refund"
- **Expected**: 
  - Success notification
  - Method and reference are saved
  - Refund approved
- **Check**: 
  - Network tab shows request body with `refundMethod` and `refundReference`

#### Test 4: Reject a Refund
- **Steps**:
  1. Click red "Reject" button
  2. Rejection dialog appears
  3. Enter rejection reason (required)
  4. Click "Reject Refund"
- **Expected**: 
  - Success notification: "Refund rejected"
  - Dialog closes
  - Refund disappears from pending list
  - Status changes to "Rejected"
- **Check**: 
  - Network tab shows `POST /approvals/refunds/{id}/reject`
  - Request body includes `reason`

#### Test 5: Cancel Dialogs
- **Steps**:
  1. Open approve or reject dialog
  2. Click "Cancel" button
- **Expected**: 
  - Dialog closes
  - Form fields reset
  - No API call made

#### Test 6: Pagination
- **Steps**: Same as Account Approvals pagination test
- **Expected**: Pagination works correctly

---

## 4. Testing Create Refund Request (From Sales Page)

### Setup: Add to Sales Page

First, you need to integrate the dialog component. Add this to your sales/orders page:

```tsx
import CreateRefundRequestDialog from '@/components/sales/CreateRefundRequestDialog';
import { useState } from 'react';

// In your component:
const [refundDialogOpen, setRefundDialogOpen] = useState(false);
const [selectedSale, setSelectedSale] = useState(null);

// In your sales list/table, add a button:
<button onClick={() => {
  setSelectedSale(sale);
  setRefundDialogOpen(true);
}}>
  Request Refund
</button>

// Add the dialog component:
<CreateRefundRequestDialog
  saleId={selectedSale?.id || ''}
  saleAmount={selectedSale?.total || 0}
  open={refundDialogOpen}
  onOpenChange={setRefundDialogOpen}
  onSuccess={() => {
    // Refresh sales data
    fetchSales();
  }}
/>
```

### Test Scenarios

#### Test 1: Open Refund Dialog
- **Steps**:
  1. Navigate to sales/orders page
  2. Find a completed sale
  3. Click "Request Refund" button
- **Expected**: 
  - Dialog opens
  - Shows sale amount
  - Has amount and reason fields

#### Test 2: Create Valid Refund Request
- **Steps**:
  1. Open refund dialog
  2. Enter valid amount (less than sale amount)
  3. Enter reason: "Customer returned item"
  4. Click "Submit Request"
- **Expected**: 
  - Success notification: "Refund request submitted successfully"
  - Dialog closes
  - Form resets
  - Request appears in Refund Requests tab
- **Check**: 
  - Network tab shows `POST /approvals/refunds`
  - Request body: `{ saleId, amount, reason }`

#### Test 3: Invalid Amount (Too High)
- **Steps**:
  1. Enter amount greater than sale amount
  2. Try to submit
- **Expected**: 
  - Error: "Refund amount cannot exceed sale amount"
  - Submit button disabled
  - Dialog stays open

#### Test 4: Invalid Amount (Zero/Negative)
- **Steps**:
  1. Enter 0 or negative amount
  2. Try to submit
- **Expected**: 
  - Error: "Please enter a valid amount"
  - Submit prevented

#### Test 5: Missing Required Fields
- **Steps**:
  1. Leave amount or reason empty
  2. Try to submit
- **Expected**: 
  - Submit button disabled
  - Appropriate error message

#### Test 6: Cancel Dialog
- **Steps**:
  1. Enter some data
  2. Click "Cancel"
- **Expected**: 
  - Dialog closes
  - No API call made
  - Data cleared

---

## 5. Integration Testing

### Test Tab Switching
1. Switch between all three tabs
2. **Expected**: 
   - Content loads correctly
   - State is preserved when switching back
   - No errors in console

### Test Permissions
1. Login with different user roles
2. **Expected**: 
   - Users with approval permissions see the page
   - Users without permissions see access denied or empty state
   - Admin users can approve/reject all types

### Test Error Handling
1. Stop backend server
2. Try to perform actions
3. **Expected**: 
   - Error messages appear
   - UI handles errors gracefully
   - No crashes

### Test Network Errors
1. Open DevTools Network tab
2. Throttle network to "Slow 3G"
3. Perform actions
4. **Expected**: 
   - Loading states show
   - Timeouts handled properly
   - Retry options available

---

## 6. Backend API Testing (Using Postman/Thunder Client)

### Test Account Approvals Endpoints

```bash
# Get Pending Accounts
GET http://localhost:5000/approvals/accounts/pending?page=1&limit=10
Headers: Authorization: Bearer <token>

# Approve Account
POST http://localhost:5000/approvals/accounts/{userId}/approve
Headers: Authorization: Bearer <token>
Body: {}

# Reject Account
POST http://localhost:5000/approvals/accounts/{userId}/reject
Headers: Authorization: Bearer <token>
Body: {
  "userId": "user-id-here",
  "reason": "Invalid information"
}
```

### Test Refund Approvals Endpoints

```bash
# Get Pending Refunds
GET http://localhost:5000/approvals/refunds/pending?page=1&limit=10
Headers: Authorization: Bearer <token>

# Create Refund Request
POST http://localhost:5000/approvals/refunds
Headers: Authorization: Bearer <token>
Body: {
  "saleId": "sale-id-here",
  "amount": 100.00,
  "reason": "Customer returned item"
}

# Approve Refund
POST http://localhost:5000/approvals/refunds/{id}/approve
Headers: Authorization: Bearer <token>
Body: {
  "refundMethod": "Bank Transfer",
  "refundReference": "REF-12345"
}

# Reject Refund
POST http://localhost:5000/approvals/refunds/{id}/reject
Headers: Authorization: Bearer <token>
Body: {
  "reason": "Refund not eligible"
}
```

---

## 7. Quick Test Checklist

### ✅ Expense Approvals
- [ ] Page loads without errors
- [ ] Can view pending expenses
- [ ] Can approve expense
- [ ] Can reject expense with reason
- [ ] Filters work correctly
- [ ] Search works

### ✅ Account Approvals
- [ ] Tab loads without errors
- [ ] Can view pending accounts
- [ ] Can approve account
- [ ] Can reject account with reason
- [ ] Rejection reason is required
- [ ] Pagination works

### ✅ Refund Requests
- [ ] Tab loads without errors
- [ ] Can view pending refunds
- [ ] Can approve refund (with/without method)
- [ ] Can reject refund with reason
- [ ] Can create refund request from sales page
- [ ] Amount validation works
- [ ] Pagination works

### ✅ Integration
- [ ] Tab switching works smoothly
- [ ] Notifications appear correctly
- [ ] Loading states show
- [ ] Error handling works
- [ ] Empty states show when no data

---

## 8. Common Issues & Solutions

### Issue: "Failed to load account approvals"
- **Solution**: Check backend is running, verify endpoint exists, check authentication token

### Issue: "403 Forbidden"
- **Solution**: User needs approval permissions. Check JWT token permissions or login as admin

### Issue: Tab shows loading forever
- **Solution**: Check Network tab for failed API calls, verify backend endpoints are correct

### Issue: Dialog doesn't close after submit
- **Solution**: Check that `onOpenChange(false)` is called after success

### Issue: Form validation not working
- **Solution**: Check browser console for errors, verify form state management

---

## 9. Browser DevTools Tips

1. **Network Tab**: 
   - Filter by "Fetch/XHR" to see API calls
   - Check request/response payloads
   - Verify status codes (200, 400, 401, 403, 500)

2. **Console Tab**: 
   - Look for error messages
   - Check for failed API calls
   - Verify data structures

3. **Application Tab**: 
   - Check localStorage for auth token
   - Verify user data is stored correctly

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify backend API is responding correctly
3. Check Network tab for failed requests
4. Verify user has correct permissions
5. Check that all endpoints are correctly configured

Happy Testing! 🚀

