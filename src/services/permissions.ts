import { API_ENDPOINTS } from "@/config/api";
import { authFetch } from "./authFetch";
// Permission service for handling role-based access control
export class PermissionService {
  private userPermissions: string[] = [];
  private userRole: string = '';

  // Initialize permissions for a user
  setUserPermissions(permissions: string[] = [], role: string = '') {
    this.userPermissions = permissions;
    this.userRole = role;
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    // Direct match
    if (this.userPermissions.includes(permission)) {
      return true;
    }

    // Handle different permission formats (internal vs JWT)
    if (permission.includes('.')) {
      // Convert from internal format (entity.action) to JWT format (action_entity)
      const [entity, action] = permission.split('.');
      const jwtFormat = `${action}_${entity}`;
      return this.userPermissions.includes(jwtFormat);
    } else if (permission.includes('_')) {
      // Convert from JWT format (action_entity) to internal format (entity.action)
      const [action, ...entityParts] = permission.split('_');
      const entity = entityParts.join('_');
      const internalFormat = `${entity}.${action}`;
      return this.userPermissions.includes(internalFormat);
    }

    return false;
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Check if user has all specified permissions
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.userRole.toLowerCase() === role.toLowerCase();
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  // Get user role
  getUserRole(): string {
    return this.userRole;
  }

  // Get user permissions
  getUserPermissions(): string[] {
    return [...this.userPermissions];
  }

  // Get menu items user can access
  getMenuItems() {
    const menuItems = [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', permissions: ['dashboard.view'] },
      // Use Orders as the visible label and key, but keep using sales permissions
      { key: 'orders', label: 'Orders', icon: 'sales', permissions: ['sales.view'] },
      { key: 'customers', label: 'Customers', icon: 'customers', permissions: ['customers.view'] },
      { key: 'approvals', label: 'Approvals', icon: 'approvals', permissions: ['approvals.view'] },
      { key: 'inventory', label: 'Inventory', icon: 'inventory', permissions: ['inventory.view', 'manage_inventory'] },
      { key: 'reports', label: 'Reports', icon: 'reports', permissions: ['reports.view'] },
      { key: 'users', label: 'Users & Roles', icon: 'users', permissions: ['users.view'] },
      { key: 'settings', label: 'Settings', icon: 'settings', permissions: ['settings.view'] },
      { key: 'audit', label: 'Audit Logs', icon: 'audit', permissions: ['audit.view_logs'] },
      { key: 'expenses', label: 'Expenses', icon: 'expenses', permissions: ['expenses.view'] }
    ];

    return menuItems.filter(item => this.hasAnyPermission(item.permissions));
  }
}

// ===== Roles API helpers =====
export interface RoleSummary {
  id: string;
  name: string;
  description?: string;
  roleType?: string;
}

export async function listRoles(): Promise<RoleSummary[]> {
  try {
    const res = await authFetch(API_ENDPOINTS.permissionsRoles);
    const data = await res.json();
    if (Array.isArray(data)) return data as RoleSummary[];
    if (Array.isArray((data as any)?.roles)) return (data as any).roles as RoleSummary[];
    return [];
  } catch (e) {
    return [];
  }
}

export async function saveUserPermissions(userId: string, permissions: Record<string, boolean>): Promise<void> {
  try {
    await authFetch(API_ENDPOINTS.permissionsUserPermissions, {
      method: 'PUT',
      body: JSON.stringify({ userId, permissions })
    });
  } catch (e) {
    // swallow to avoid breaking UI; caller may show error
  }
}

// Permission constants
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  APPROVALS_VIEW: 'approvals.view',
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_EDIT: 'sales.edit',
  SALES_DELETE: 'sales.delete',
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MANAGE: 'inventory.manage',
  REPORTS_VIEW: 'reports.view',
  SETTINGS_VIEW: 'settings.view',
  AUDIT_VIEW_LOGS: 'audit.view_logs',
  EXPENSES_VIEW: 'expenses.view'
};

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MANAGING_DIRECTOR: 'managing_director',
  SALES: 'sales_staff',
  SUPPORT: 'technical_support',
  VIEWER: 'viewer'
};

// Default permissions by role
export const getDefaultPermissions = (role: string): string[] => {
  switch (role.toLowerCase()) {
    case ROLES.ADMIN:
      return [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_EDIT, PERMISSIONS.USERS_DELETE,
        PERMISSIONS.APPROVALS_VIEW,
        PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_EDIT, PERMISSIONS.PRODUCTS_DELETE,
        PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_CREATE, PERMISSIONS.SALES_EDIT, PERMISSIONS.SALES_DELETE,
        PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_CREATE, PERMISSIONS.CUSTOMERS_EDIT, PERMISSIONS.CUSTOMERS_DELETE,
        PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.AUDIT_VIEW_LOGS,
        PERMISSIONS.EXPENSES_VIEW
      ];
    case ROLES.MANAGER:
      return [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_CREATE, PERMISSIONS.SALES_EDIT,
        PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_CREATE, PERMISSIONS.CUSTOMERS_EDIT,
        PERMISSIONS.APPROVALS_VIEW,
        PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_EDIT,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.EXPENSES_VIEW
      ];
    case ROLES.MANAGING_DIRECTOR:
      // Mirror manager defaults to ensure access to Expenses page
      return [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_CREATE, PERMISSIONS.SALES_EDIT,
        PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_CREATE, PERMISSIONS.CUSTOMERS_EDIT,
        PERMISSIONS.APPROVALS_VIEW,
        PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_EDIT,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.EXPENSES_VIEW
      ];
    case ROLES.SALES:
      return [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_CREATE,
        PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_CREATE,
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.INVENTORY_VIEW,
        // Allow sales staff to access Approvals
        PERMISSIONS.APPROVALS_VIEW
      ];
    case ROLES.SUPPORT:
      return [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_EDIT,
        PERMISSIONS.REPORTS_VIEW
      ];
    case ROLES.VIEWER:
      return [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.REPORTS_VIEW
      ];
    default:
      return [];
  }
};
