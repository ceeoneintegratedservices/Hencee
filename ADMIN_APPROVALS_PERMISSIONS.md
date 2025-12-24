# Admin Approvals Permissions Guide

This document explains what permissions an admin needs to see the "Approvals" menu item on the sidebar and access the approvals page.

---

## 📋 **Summary**

For an admin to see the **Approvals** menu item on the sidebar and access the approvals page, they need **at least ONE** of the following permissions:

- `approvals.view` ✅ (Primary - Admin gets this by default)
- `approval.view_requests`
- `approve.payment_request`
- `approve.invoice_request`
- `approve.refund`
- `approve.user_accounts`
- `approve.daily_expense`
- `approve.void`

---

## 🔍 **Detailed Breakdown**

### **1. Sidebar Menu Item Visibility**

**Location**: `src/services/permissions.ts` (Line 105)

**Code**:
```typescript
{ 
  key: 'approvals', 
  label: 'Approvals', 
  icon: 'approvals', 
  permissions: [
    'approvals.view', 
    'approval.view_requests', 
    'approve.payment_request', 
    'approve.invoice_request', 
    'approve.refund', 
    'approve.user_accounts', 
    'approve.daily_expense', 
    'approve.void'
  ] 
}
```

**Logic**: The menu item appears if the user has **ANY** of these permissions (uses `hasAnyPermission()`).

---

### **2. Admin Default Permissions**

**Location**: `src/services/permissions.ts` (Line 197)

**Code**:
```typescript
case ROLES.ADMIN:
  return [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_EDIT, PERMISSIONS.USERS_DELETE,
    PERMISSIONS.APPROVALS_VIEW,  // ← Admin gets this by default
    // ... other permissions
  ];
```

**Result**: Admin role includes `PERMISSIONS.APPROVALS_VIEW` which equals `'approvals.view'`.

---

### **3. Admin Fallback Permissions**

**Location**: `src/hooks/usePermissions.tsx` (Lines 108-125)

**Code**:
```typescript
// For admin users, ensure they have approval permissions even if not in the list
// This handles cases where the backend hasn't included all admin permissions
if (roleName.toLowerCase() === 'admin' && !userPermissions.some(p => 
  p.includes('approval') || p.includes('approve') || p === 'approvals.view'
)) {
  // Add approval permissions for admin if missing
  userPermissions = [
    ...userPermissions,
    'approval.view_requests',
    'approve.payment_request',
    'approve.invoice_request',
    'approve.refund',
    'approve.user_accounts',
    'approve.daily_expense',
    'approve.void',
    'approvals.view'
  ];
}
```

**Purpose**: If the backend doesn't return approval permissions for an admin user, the frontend automatically adds them as a fallback.

**Trigger**: This runs if admin doesn't have ANY permission containing "approval" or "approve" or the exact permission "approvals.view".

---

### **4. Approvals Page Access**

**Location**: `src/app/approvals/page.tsx` (Lines 39-47)

**Code**:
```typescript
const { hasPermission } = usePermissions();

// Check permissions for tab visibility
const canViewAccounts = hasPermission('approve.user_accounts') || hasPermission('approval.view_requests');
const canViewRefunds = hasPermission('approve.refund') || hasPermission('approval.view_requests');
const canViewExpenses = hasPermission('approve.daily_expense') || hasPermission('approval.view_requests') || hasPermission('expenses.view');
```

**Note**: The approvals page itself doesn't have a permission check to prevent access. However, the tabs inside require specific permissions:

- **Accounts Tab**: `approve.user_accounts` OR `approval.view_requests`
- **Refunds Tab**: `approve.refund` OR `approval.view_requests`
- **Expenses Tab**: `approve.daily_expense` OR `approval.view_requests` OR `expenses.view`

---

## ✅ **What Admin Gets**

### **From Default Permissions** (Backend)
- ✅ `approvals.view` - This is sufficient to see the menu item

### **From Fallback** (Frontend - if backend doesn't provide)
If backend doesn't return approval permissions, frontend adds:
- ✅ `approvals.view`
- ✅ `approval.view_requests`
- ✅ `approve.payment_request`
- ✅ `approve.invoice_request`
- ✅ `approve.refund`
- ✅ `approve.user_accounts`
- ✅ `approve.daily_expense`
- ✅ `approve.void`

---

## 🎯 **Minimum Required Permission**

**For Sidebar Menu**: Admin needs **at least ONE** of:
- `approvals.view` ← **This is the primary one admin gets by default**

**For Approvals Page**: No explicit permission check (page is accessible if menu item is visible)

**For Page Tabs**: 
- **Accounts Tab**: `approve.user_accounts` OR `approval.view_requests`
- **Refunds Tab**: `approve.refund` OR `approval.view_requests`
- **Expenses Tab**: `approve.daily_expense` OR `approval.view_requests` OR `expenses.view`

---

## 🔧 **Troubleshooting**

### **Admin Cannot See Approvals Menu**

**Possible Causes**:
1. Backend not returning `approvals.view` permission
2. Backend not returning any approval-related permissions
3. Frontend fallback not working

**Solutions**:

1. **Check Backend Response**:
   - Verify admin user's permissions include `approvals.view` or any approval permission
   - Check JWT token or user data endpoint

2. **Check Frontend Fallback**:
   - Open browser console
   - Check if fallback permissions are being added
   - Look for: "For admin users, ensure they have approval permissions..."

3. **Manual Fix**:
   - Ensure backend returns at least `approvals.view` for admin role
   - Or ensure backend returns any of the approval permissions listed above

### **Admin Can See Menu But Cannot Access Tabs**

**Possible Causes**:
- Admin doesn't have specific tab permissions

**Solutions**:
- Ensure admin has:
  - `approve.user_accounts` for Accounts tab
  - `approve.refund` for Refunds tab
  - `approve.daily_expense` OR `expenses.view` for Expenses tab

---

## 📝 **Backend Requirements**

### **Recommended Backend Permissions for Admin**

The backend should return **at least** these permissions for admin users:

```json
{
  "permissions": [
    "approvals.view",
    "approval.view_requests",
    "approve.payment_request",
    "approve.invoice_request",
    "approve.refund",
    "approve.user_accounts",
    "approve.daily_expense",
    "approve.void"
  ]
}
```

**Minimum**: `approvals.view` is sufficient for menu visibility.

**Full Access**: All permissions above provide access to all tabs and features.

---

## 🔄 **Permission Format Handling**

The permission system handles both formats:

1. **Internal Format**: `approvals.view` (dot notation)
2. **JWT Format**: `view_approvals` (underscore notation)

**Location**: `src/services/permissions.ts` (Lines 22-63)

The system automatically converts between formats, so both work:
- ✅ `approvals.view`
- ✅ `view_approvals`

---

## 📊 **Permission Check Flow**

```
Admin User Logs In
    ↓
Backend Returns Permissions
    ↓
Frontend Checks: Does admin have approval permissions?
    ↓
    ├─ YES → Use backend permissions
    │
    └─ NO → Add fallback permissions
            (approvals.view + all approval permissions)
    ↓
PermissionService.getMenuItems()
    ↓
Check: hasAnyPermission(['approvals.view', 'approval.view_requests', ...])
    ↓
    ├─ YES → Show "Approvals" menu item ✅
    │
    └─ NO → Hide "Approvals" menu item ❌
```

---

## 🎯 **Quick Reference**

| What | Required Permission | Admin Gets It? |
|------|---------------------|----------------|
| **Sidebar Menu** | `approvals.view` OR any approval permission | ✅ Yes (default) |
| **Approvals Page** | No explicit check | ✅ Accessible if menu visible |
| **Accounts Tab** | `approve.user_accounts` OR `approval.view_requests` | ✅ Yes (fallback) |
| **Refunds Tab** | `approve.refund` OR `approval.view_requests` | ✅ Yes (fallback) |
| **Expenses Tab** | `approve.daily_expense` OR `approval.view_requests` OR `expenses.view` | ✅ Yes (fallback) |

---

## 📚 **Related Files**

- `src/services/permissions.ts` - Permission definitions and menu items
- `src/hooks/usePermissions.tsx` - Permission provider and admin fallback
- `src/components/Sidebar.tsx` - Sidebar menu rendering
- `src/app/approvals/page.tsx` - Approvals page and tab permissions

---

## ❓ **FAQ**

**Q: Why doesn't admin see approvals menu?**  
A: Check if backend returns `approvals.view` or any approval permission. Frontend fallback should add it, but verify it's working.

**Q: Admin sees menu but tabs are empty/hidden?**  
A: Admin needs specific tab permissions (`approve.user_accounts`, `approve.refund`, `approve.daily_expense`). Check if fallback added them.

**Q: Can I manually add permissions?**  
A: Yes, ensure backend returns the required permissions. Frontend fallback is a safety net but shouldn't be relied upon.

**Q: What's the difference between `approvals.view` and `approval.view_requests`?**  
A: Both grant access to the approvals menu. `approvals.view` is the primary permission, while `approval.view_requests` is an alternative format.

---

**Last Updated**: December 2024  
**Version**: 1.0

