# Fix: Sales Representative Missing Dashboard Permission

## Issue

The `sales_representative` role is missing the `dashboard.view` permission in the backend, causing a `403 Forbidden` error when accessing dashboard endpoints.

**Error:**
```
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Insufficient permissions. Missing: dashboard.view",
  "path": "/api/ceeone/dashboard/activities"
}
```

## Root Cause

The backend role configuration for `sales_representative` does not include the `dashboard.view` permission, even though:
1. The frontend expects it (defined in `src/services/permissions.ts`)
2. The dashboard page requires it to display activities
3. All other roles that can access the dashboard have this permission

## Current Backend Permissions (from JWT token)

The `sales_representative` role currently has:
- ✅ `create_sales`
- ✅ `update_sales`
- ✅ `view_sales`
- ✅ `create_customers`
- ✅ `update_customers`
- ✅ `view_customers`
- ✅ `view_products`
- ✅ `process_payments`
- ✅ `view_payments`
- ❌ **Missing: `dashboard.view`** (or `view_dashboard`)

## Expected Permissions (from Frontend)

According to `src/services/permissions.ts`, the `sales_representative` role should have:
- ✅ `dashboard.view` ← **MISSING IN BACKEND**
- ✅ `sales.view`
- ✅ `sales.create`
- ✅ `customers.view`
- ✅ `customers.create`
- ✅ `products.view`
- ✅ `inventory.view`
- ✅ `approvals.view`
- ✅ `expenses.view`
- ✅ `expenses.create`

## Backend Fix Required

### Option 1: Update Role Default Permissions (Recommended)

In your backend code, update the default permissions for the `sales_representative` role to include `dashboard.view`:

**If using permission format `entity.action`:**
```typescript
// Backend role permissions configuration
const SALES_REPRESENTATIVE_PERMISSIONS = [
  'dashboard.view',        // ← ADD THIS
  'sales.view',
  'sales.create',
  'sales.edit',
  'customers.view',
  'customers.create',
  'customers.edit',
  'products.view',
  'inventory.view',
  'approvals.view',
  'expenses.view',
  'expenses.create',
  'process_payments',
  'view_payments'
];
```

**If using permission format `action_entity`:**
```typescript
const SALES_REPRESENTATIVE_PERMISSIONS = [
  'view_dashboard',        // ← ADD THIS
  'view_sales',
  'create_sales',
  'update_sales',
  'view_customers',
  'create_customers',
  'update_customers',
  'view_products',
  'view_inventory',
  'view_approvals',
  'view_expenses',
  'create_expenses',
  'process_payments',
  'view_payments'
];
```

### Option 2: Update Database Directly

If permissions are stored in the database, update the role permissions:

```sql
-- Add dashboard.view permission to sales_representative role
INSERT INTO role_permissions (role_id, permission)
SELECT r.id, 'dashboard.view'
FROM roles r
WHERE r.role_type = 'sales_representative'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = r.id 
  AND rp.permission = 'dashboard.view'
);
```

Or if using `view_dashboard` format:
```sql
INSERT INTO role_permissions (role_id, permission)
SELECT r.id, 'view_dashboard'
FROM roles r
WHERE r.role_type = 'sales_representative'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = r.id 
  AND rp.permission = 'view_dashboard'
);
```

### Option 3: Update Existing Users

If you need to grant this permission to existing users with the `sales_representative` role:

```sql
-- Grant dashboard.view to existing sales representatives
INSERT INTO user_permissions (user_id, permission)
SELECT u.id, 'dashboard.view'
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.role_type = 'sales_representative'
AND NOT EXISTS (
  SELECT 1 FROM user_permissions up 
  WHERE up.user_id = u.id 
  AND up.permission = 'dashboard.view'
);
```

## Verification

After applying the fix:

1. **Test User Login:**
   ```bash
   curl -X POST http://localhost:5000/api/ceeone/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "jessiewillard01@gmail.com",
       "password": "your-password"
     }'
   ```

2. **Decode JWT Token:**
   - Check that `dashboard.view` (or `view_dashboard`) is in the `permissions` array

3. **Test Dashboard Endpoint:**
   ```bash
   curl -X GET "http://localhost:5000/api/ceeone/dashboard/activities?timeframe=allTime&limit=100" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   - Should return `200 OK` instead of `403 Forbidden`

4. **Frontend Test:**
   - Login as sales representative
   - Navigate to dashboard
   - Activities section should load without errors

## Permission Format Note

**Important:** Check which permission format your backend uses:

- **Format 1:** `entity.action` (e.g., `dashboard.view`, `sales.create`)
- **Format 2:** `action_entity` (e.g., `view_dashboard`, `create_sales`)

The frontend supports both formats (see `src/services/permissions.ts`), but the backend must be consistent. Based on the JWT token you showed, your backend uses `action_entity` format, so you should add `view_dashboard` to the permissions.

## Related Files

- Frontend: `src/services/permissions.ts` (lines 254-263)
- Frontend: `src/app/dashboard/page.tsx` (uses `dashboard.view` permission)
- Frontend: `src/services/dashboard.ts` (calls dashboard endpoints)
- Backend: Role permissions configuration (location depends on your backend structure)

## Summary

**Action Required:** Add `dashboard.view` (or `view_dashboard` depending on your format) to the `sales_representative` role's default permissions in the backend.

**Impact:** This will allow sales representatives to:
- ✅ Access the dashboard page
- ✅ View dashboard activities
- ✅ See dashboard overview data
- ✅ Use all dashboard features

**Priority:** **High** - This blocks sales representatives from accessing the dashboard, which is a core feature.
