# Backend Compatibility Verification Guide

## Overview

This guide helps you verify that your backend is compatible with the frontend role permission system. It covers checking role types, permission guards, API endpoints, and JWT token structure.

## Quick Verification Checklist

### ✅ Step 1: Verify Role Types Exist in Backend

**What to Check:**
- Backend database/seed data contains all role types
- Role types match frontend expectations exactly

**How to Verify:**

1. **Check Backend Role Definitions**
   ```bash
   # If you have access to backend codebase, check:
   # - Role entity/model definitions
   # - Role seed data
   # - Role enum/constants
   ```

2. **Test via API**
   ```bash
   # Get all roles from backend
   curl -X GET http://localhost:5000/api/ceeone/permissions/roles \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

3. **Expected Role Types:**
   - `admin`
   - `managing_director`
   - `general_manager`
   - `sales_representative` (or `sales_staff`)
   - `book_storekeeper`
   - `auditor`
   - `accountant`
   - `cashier`
   - `manager` (if different from `general_manager`)
   - `technical_support`
   - `viewer`

### ✅ Step 2: Verify User Creation Accepts Role Types

**What to Check:**
- User creation endpoint accepts `roleType` field
- Backend validates role types
- New roles can be assigned during user creation

**How to Verify:**

1. **Test User Creation**
   ```bash
   # Create a test user with each role type
   curl -X POST http://localhost:5000/api/ceeone/users \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test-general-manager@example.com",
       "password": "test123",
       "name": "Test General Manager",
       "roleType": "general_manager",
       "isEmailVerified": true
     }'
   ```

2. **Expected Response:**
   - Status: `201 Created` or `200 OK`
   - User object with correct `roleType`
   - No validation errors about invalid role type

3. **Test All New Roles:**
   - `general_manager`
   - `accountant`
   - `auditor`
   - `cashier`
   - `sales_representative`

### ✅ Step 3: Verify JWT Token Contains Permissions

**What to Check:**
- JWT token payload includes `permissions` array
- Permissions are in correct format (either `entity.action` or `action_entity`)
- Role information is included in token

**How to Verify:**

1. **Login and Decode Token**
   ```bash
   # Login as a test user
   curl -X POST http://localhost:5000/api/ceeone/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test-accountant@example.com",
       "password": "test123"
     }'
   ```

2. **Decode JWT Token**
   - Copy the `accessToken` from response
   - Use [jwt.io](https://jwt.io) or decode in code:
   ```javascript
   const token = "YOUR_TOKEN";
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Permissions:', payload.permissions);
   console.log('Role:', payload.role);
   ```

3. **Expected Token Structure:**
   ```json
   {
     "sub": "user-id",
     "email": "user@example.com",
     "role": "accountant",
     "roleType": "accountant",
     "permissions": [
       "dashboard.view",
       "sales.view",
       "customers.view",
       "reports.view",
       "expenses.view",
       "expenses.create",
       "expenses.edit",
       "approvals.view"
     ],
     "iat": 1234567890,
     "exp": 1234571490
   }
   ```

### ✅ Step 4: Verify Permission Guards on Endpoints

**What to Check:**
- API endpoints are protected by permission guards
- Guards check user permissions correctly
- Returns `403 Forbidden` when permission is missing
- Returns `200/201` when permission exists

**How to Verify:**

1. **Test Protected Endpoints**
   ```bash
   # Test as Accountant (should have reports.view)
   curl -X GET http://localhost:5000/api/ceeone/reports/sales \
     -H "Authorization: Bearer ACCOUNTANT_TOKEN"
   # Expected: 200 OK

   # Test as Cashier (should NOT have reports.view)
   curl -X GET http://localhost:5000/api/ceeone/reports/sales \
     -H "Authorization: Bearer CASHIER_TOKEN"
   # Expected: 403 Forbidden
   ```

2. **Test Permission Checks**
   - Use the automated test script (see below)
   - Or manually test each endpoint with different roles

### ✅ Step 5: Verify Default Permissions for Roles

**What to Check:**
- Each role has default permissions assigned
- Permissions match frontend expectations
- New roles have appropriate default permissions

**How to Verify:**

1. **Check Role Permissions via API**
   ```bash
   # Get role details
   curl -X GET http://localhost:5000/api/ceeone/permissions/roles/accountant \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

2. **Compare with Frontend**
   - Check `src/services/permissions.ts` `getDefaultPermissions()` function
   - Ensure backend role permissions match frontend expectations

3. **Expected Permissions by Role:**

   **Accountant:**
   - `dashboard.view`
   - `sales.view`
   - `customers.view`
   - `products.view`
   - `reports.view`
   - `expenses.view`, `expenses.create`, `expenses.edit`
   - `approvals.view`
   - `sales.edit` (for processing payments)

   **Auditor:**
   - `dashboard.view`
   - `sales.view`
   - `customers.view`
   - `products.view`
   - `inventory.view`
   - `reports.view`
   - `expenses.view`
   - `audit.view_logs`

   **Cashier:**
   - `dashboard.view`
   - `sales.view`, `sales.create`, `sales.edit`
   - `customers.view`, `customers.create`, `customers.edit`
   - `products.view`
   - `inventory.view`

   **General Manager:**
   - Same as `manager` role
   - `dashboard.view`
   - `sales.view`, `sales.create`, `sales.edit`
   - `customers.view`, `customers.create`, `customers.edit`
   - `products.view`, `products.edit`
   - `inventory.view`
   - `reports.view`
   - `approvals.view`
   - `expenses.view`, `expenses.create`, `expenses.edit`

### ✅ Step 6: Verify API Endpoint Structure

**What to Check:**
- API endpoints match frontend expectations
- Request/response formats are correct
- Error responses are properly formatted

**How to Verify:**

1. **Test Key Endpoints**
   - Users: `/api/ceeone/users`
   - Products: `/api/ceeone/products`
   - Sales: `/api/ceeone/sales`
   - Customers: `/api/ceeone/customers`
   - Inventory: `/api/ceeone/pharma/inventory`
   - Reports: `/api/ceeone/reports/sales`, `/api/ceeone/reports/financial`
   - Expenses: `/api/ceeone/expenses`
   - Approvals: `/api/ceeone/approvals/pending`

2. **Check Response Format**
   - Ensure responses match frontend TypeScript interfaces
   - Check error response format (should include error message)

## Automated Verification Script

Use the provided script to automatically verify backend compatibility:

```bash
node scripts/verify-backend-compatibility.js http://localhost:5000
```

This script will:
1. ✅ Check if all role types exist
2. ✅ Test user creation for each role
3. ✅ Verify JWT token structure
4. ✅ Test permission guards on endpoints
5. ✅ Compare permissions with frontend expectations
6. ✅ Generate a compatibility report

## Manual Verification Steps

### 1. Database/Backend Code Inspection

**Check Role Entity/Model:**
```typescript
// Backend should have something like:
enum RoleType {
  ADMIN = 'admin',
  MANAGING_DIRECTOR = 'managing_director',
  GENERAL_MANAGER = 'general_manager',
  SALES_REPRESENTATIVE = 'sales_representative',
  BOOK_STOREKEEPER = 'book_storekeeper',
  AUDITOR = 'auditor',
  ACCOUNTANT = 'accountant',
  CASHIER = 'cashier',
  // ... other roles
}
```

**Check Permission Guard:**
```typescript
// Backend should have permission guard like:
@UseGuards(PermissionGuard)
@RequiresPermission('reports.view')
@Get('reports/sales')
async getSalesReport() {
  // ...
}
```

### 2. Test User Creation Flow

1. Create admin user (if not exists)
2. Login as admin
3. Create test users for each new role:
   - General Manager
   - Accountant
   - Auditor
   - Cashier
4. Verify each user can login
5. Verify each user receives correct permissions in JWT

### 3. Test Permission Enforcement

For each role, test:
- ✅ Endpoints that should work (return 200)
- ❌ Endpoints that should be blocked (return 403)

Example test matrix:

| Endpoint | Admin | Accountant | Auditor | Cashier |
|----------|-------|------------|---------|---------|
| GET /users | ✅ | ❌ | ❌ | ❌ |
| GET /reports/sales | ✅ | ✅ | ✅ | ❌ |
| POST /sales | ✅ | ❌ | ❌ | ✅ |
| GET /expenses | ✅ | ✅ | ✅ | ❌ |
| POST /expenses | ✅ | ✅ | ❌ | ❌ |

## Common Issues and Solutions

### Issue 1: Role Type Not Found

**Error:** `Invalid role type: general_manager`

**Solution:**
- Add role type to backend enum/constants
- Update database seed data
- Ensure role type matches exactly (case-sensitive)

### Issue 2: Permissions Not in JWT

**Error:** Frontend can't find permissions in token

**Solution:**
- Update JWT token generation to include permissions
- Ensure permissions are fetched from user's role
- Check token payload structure

### Issue 3: Permission Guard Not Working

**Error:** Users can access endpoints they shouldn't

**Solution:**
- Verify permission guard is applied to endpoints
- Check permission check logic
- Ensure permissions are being validated correctly

### Issue 4: Permission Format Mismatch

**Error:** Frontend uses `entity.action` but backend uses `action_entity`

**Solution:**
- Standardize permission format (recommend `entity.action`)
- Update either frontend or backend to match
- Or implement format conversion in permission service

## Verification Report Template

After verification, document your findings:

```markdown
## Backend Compatibility Report

**Date:** [Date]
**Backend Version:** [Version]
**API Base URL:** [URL]

### Role Types
- [ ] All role types exist in backend
- [ ] Role types match frontend exactly

### User Creation
- [ ] Can create users with all role types
- [ ] Role validation works correctly

### JWT Tokens
- [ ] Tokens include permissions array
- [ ] Permission format is correct
- [ ] Role information is included

### Permission Guards
- [ ] Endpoints are protected
- [ ] Guards return correct status codes
- [ ] Permission checks work correctly

### Default Permissions
- [ ] All roles have default permissions
- [ ] Permissions match frontend expectations

### Issues Found
[List any issues]

### Recommendations
[List recommendations]
```

## Next Steps

After verification:

1. **If Issues Found:**
   - Document all issues
   - Create backend tickets for fixes
   - Update frontend to work around issues (if possible)

2. **If All Checks Pass:**
   - Run full test suite
   - Deploy to staging environment
   - Perform integration testing

3. **Ongoing:**
   - Add backend compatibility checks to CI/CD
   - Monitor permission-related errors
   - Keep frontend and backend role definitions in sync

## Related Documentation

- `docs/ROLE_PERMISSION_IMPLEMENTATION_STATUS.md` - Implementation status
- `scripts/test-role-permissions.js` - Permission testing script
- `src/services/permissions.ts` - Frontend permission definitions
- `src/config/api.ts` - API endpoint definitions
