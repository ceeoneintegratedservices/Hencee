# Book Storekeeper Role (book_storekeeper) - Page Access

## Overview
The **Book Storekeeper** role (`book_storekeeper`) is designed for inventory management staff who handle product stock, inventory adjustments, and basic sales/customer viewing.

## Permissions
Based on the default permissions defined in `src/services/permissions.ts`, the Book Storekeeper role has the following permissions:

- `dashboard.view` - View dashboard
- `products.create` - Create new products
- `inventory.manage` - Manage inventory (adjust stock, record movements, etc.)
- `products.edit` - Edit existing products
- `customers.view` - View customer information
- `products.view` - View product information
- `sales.view` - View sales/orders
- `inventory.view` - View inventory information

## Accessible Pages

Based on the menu items defined in `PermissionService.getMenuItems()`, the Book Storekeeper can access:

### ✅ **Dashboard**
- **Permission**: `dashboard.view`
- **Access**: Full access to dashboard overview

### ✅ **Orders (Sales)**
- **Permission**: `sales.view`
- **Access**: View all orders/sales transactions
- **Note**: Can view but may not have permissions to create/edit/delete orders (depends on specific permissions)

### ✅ **Customers**
- **Permission**: `customers.view`
- **Access**: View customer information
- **Note**: Can view but may not have permissions to create/edit/delete customers (depends on specific permissions)

### ✅ **Inventory**
- **Permissions**: `inventory.view`, `manage_inventory`, `view_products`, `products.view`, `view_inventory`
- **Access**: 
  - View inventory levels
  - Manage inventory (adjust stock, record movements)
  - View products
  - Create products (`products.create`)
  - Edit products (`products.edit`)

## Restricted Pages

The Book Storekeeper role **cannot** access:

### ❌ **Approvals**
- **Reason**: No `approvals.view` or related approval permissions

### ❌ **Reports**
- **Reason**: No `reports.view` permission

### ❌ **Users & Roles**
- **Reason**: No `users.view` permission

### ❌ **Settings**
- **Reason**: No `settings.view` permission

### ❌ **Audit Logs**
- **Reason**: No `audit.view_logs` permission

### ❌ **Expenses**
- **Reason**: No `expenses.view` permission

## Summary

**Total Accessible Pages**: 4
1. Dashboard
2. Orders (Sales)
3. Customers
4. Inventory

**Primary Responsibilities**:
- Manage inventory levels
- Create and edit products
- View sales/orders
- View customer information

**Restrictions**:
- Cannot approve requests
- Cannot view reports
- Cannot manage users
- Cannot access system settings
- Cannot view audit logs
- Cannot manage expenses
