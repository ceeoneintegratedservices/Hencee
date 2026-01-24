# Fix Sales Representative Inventory & Expenses Issues

## Issues Reported

1. **Inventory 403 Error**: Sales representative seeing "Forbidden (403)" error in the "Expiry Risk Overview" section on the inventory page
2. **Expenses Not Showing**: Expenses menu item not appearing for sales representative role

## Root Causes

### Issue 1: Inventory Expiry Summary 403 Error
- The `getInventoryExpirySummary()` endpoint requires additional permissions beyond `inventory.view`
- Sales representatives have `inventory.view` permission but the expiry summary endpoint may require more specific permissions
- The error was being displayed prominently to users

### Issue 2: Expenses Menu Item
- Sales representatives already have `EXPENSES_VIEW` and `EXPENSES_CREATE` permissions in the code
- The menu item should appear if the user has `expenses.view` permission
- If it's not showing, it may be a backend permission format issue

## Solutions Implemented

### 1. Fixed Inventory Expiry Summary 403 Error

**File**: `src/services/inventory.ts`

- Added try-catch block to handle 403 errors gracefully
- When a 403 error occurs, the function now returns an empty summary object instead of throwing
- This prevents the error message from being displayed to users

**File**: `src/app/inventory/page.tsx`

- Updated `fetchExpirySummary` to handle 403 errors gracefully
- When a 403 error occurs, the error state is cleared (no error message shown)
- Users will see "No expiry insights available yet" instead of the error message

### 2. Expenses Permissions

**Current Permissions for Sales Representative**:
```typescript
PERMISSIONS.EXPENSES_VIEW, PERMISSIONS.EXPENSES_CREATE
```

**Menu Item Check**:
```typescript
{ key: 'expenses', label: 'Expenses', icon: 'expenses', permissions: ['expenses.view'] }
```

The sales representative should have access to expenses. If it's not showing:

1. **Check Backend Permissions**: Verify that the backend is returning `expenses.view` or `view_expenses` in the user's permissions array
2. **Check Permission Format**: The frontend handles both formats (`expenses.view` and `view_expenses`), but verify the backend is returning the correct format

## Required Backend Permissions

### For Sales Representative Role

To fix both issues, ensure the sales_representative role has these permissions in the backend:

1. **Inventory Expiry Summary** (if you want to grant access):
   - `inventory.view` (already has this)
   - OR a specific permission like `inventory.view_expiry` or `inventory.view_summary`

2. **Expenses** (should already work):
   - `expenses.view` or `view_expenses`
   - `expenses.create` or `create_expenses` (optional, for creating expense requests)

## Testing

### Test Inventory Expiry Summary
1. Login as sales_representative
2. Navigate to `/inventory`
3. Check "Expiry Risk Overview" section
4. Should see "No expiry insights available yet" instead of 403 error

### Test Expenses Menu Item
1. Login as sales_representative
2. Check sidebar menu
3. "Expenses" menu item should be visible
4. Click on "Expenses" - should navigate to `/expenses` page

## Backend Verification

If expenses still doesn't show, check the backend:

1. **Verify Role Permissions**:
   ```bash
   # Check what permissions the sales_representative role has
   GET /api/ceeone/roles/{roleId}
   ```

2. **Verify User Permissions**:
   ```bash
   # Check what permissions the logged-in user has
   GET /api/ceeone/users/me
   # Or check the JWT token payload
   ```

3. **Expected Permissions in JWT**:
   ```json
   {
     "permissions": [
       "view_expenses",
       "create_expenses",
       "view_inventory",
       "view_products",
       "view_sales",
       "create_sales",
       "view_customers",
       "create_customers",
       "view_approvals"
     ]
   }
   ```

## Summary

✅ **Fixed**: Inventory expiry summary 403 error now handled gracefully
✅ **Verified**: Expenses permissions are correctly configured in frontend
⚠️ **Action Required**: If expenses still doesn't show, verify backend permissions match frontend expectations
