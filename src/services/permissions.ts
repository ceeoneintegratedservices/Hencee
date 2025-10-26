// Frontend Permission Service
export class PermissionService {
  private userPermissions: string[] = [];
  private userRole: string = '';

  setUserPermissions(permissions: string[], role: string) {
    this.userPermissions = permissions;
    this.userRole = role;
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    // Direct match
    if (this.userPermissions.includes(permission)) {
      return true;
    }
    
    // Check for JWT format equivalent using pattern matching
    // This handles both explicit mappings and pattern-based mappings
    
    // 1. Explicit mappings for special cases
    const explicitJwtFormatMap: Record<string, string> = {
      'users.view': 'view_users',
      'users.create': 'create_users',
      'users.edit': 'update_users',
      'users.delete': 'delete_users',
      'users.manage': 'manage_users',
      'products.view': 'view_products',
      'products.create': 'create_products',
      'products.edit': 'update_products',
      'products.delete': 'delete_products',
      'sales.view': 'view_sales',
      'sales.create': 'create_sales',
      'sales.edit': 'update_sales',
      'sales.delete': 'delete_sales',
      'customers.view': 'view_customers',
      'customers.create': 'create_customers',
      'customers.edit': 'update_customers',
      'customers.delete': 'delete_customers',
      'reports.view': 'view_reports',
      'reports.generate': 'generate_reports',
      'expenses.view': 'view_expenses',
      'expenses.create': 'create_expenses',
      'expenses.edit': 'update_expenses',
      'expenses.delete': 'delete_expenses',
      'expenses.approve': 'approve_expenses',
      'inventory.view': 'view_inventory',
      'inventory.create': 'create_inventory',
      'inventory.edit': 'update_inventory',
      'inventory.delete': 'delete_inventory',
      'dashboard.view': 'view_dashboard',
      'settings.view': 'view_settings',
      'settings.edit': 'update_settings',
      'audit.view_logs': 'view_audit_logs'
    };
    
    // Check explicit mappings first
    if (explicitJwtFormatMap[permission] && this.userPermissions.includes(explicitJwtFormatMap[permission])) {
      return true;
    }
    
    // 2. Pattern-based matching for dynamic permissions
    // Convert "entity.action" to "action_entity" format (e.g., "users.view" → "view_users")
    const parts = permission.split('.');
    if (parts.length === 2) {
      const [entity, action] = parts;
      
      // Convert action verbs
      const actionMap: Record<string, string> = {
        'view': 'view',
        'create': 'create',
        'edit': 'update',
        'update': 'update',
        'delete': 'delete',
        'manage': 'manage',
        'approve': 'approve',
        'generate': 'generate'
      };
      
      const mappedAction = actionMap[action] || action;
      const jwtFormat = `${mappedAction}_${entity}`;
      
      if (this.userPermissions.includes(jwtFormat)) {
        return true;
      }
    }
    
    // 3. Check reverse format (for permissions already in JWT format)
    // Convert "action_entity" to "entity.action" format (e.g., "view_users" → "users.view")
    if (permission.includes('_')) {
      const [action, ...entityParts] = permission.split('_');
      const entity = entityParts.join('_');
      
      // Convert action verbs
      const actionMap: Record<string, string> = {
        'view': 'view',
        'create': 'create',
        'update': 'edit',
        'delete': 'delete',
        'manage': 'manage',
        'approve': 'approve',
        'generate': 'generate'
      };
      
      const mappedAction = actionMap[action] || action;
      const internalFormat = `${entity}.${mappedAction}`;
      
      if (this.userPermissions.includes(internalFormat)) {
        return true;
      }
    }
    
    // If we've reached here, no matches were found
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
    return this.userRole === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.userRole);
  }

  // Get UI components user can see
  getVisibleComponents(): string[] {
    const componentPermissions: Record<string, string[]> = {
      'dashboard': ['dashboard.view'],
      'users': ['users.view'],
      'products': ['products.view'],
      'customers': ['customers.view'],
      'sales': ['sales.view'],
      'inventory': ['inventory.view'],
      'reports': ['reports.view'],
      'settings': ['settings.view'],
      'audit': ['audit.view_logs'],
      'expenses': ['expenses.view']
    };

    return Object.keys(componentPermissions).filter(component => 
      this.hasAnyPermission(componentPermissions[component])
    );
  }

  // Get menu items user can access
  getMenuItems() {
    const menuItems = [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', permissions: ['dashboard.view'] },
      { key: 'sales', label: 'Sales', icon: 'sales', permissions: ['sales.view'] },
      { key: 'customers', label: 'Customers', icon: 'customers', permissions: ['customers.view'] },
      { key: 'products', label: 'Products', icon: 'products', permissions: ['products.view'] },
      { key: 'inventory', label: 'Inventory', icon: 'inventory', permissions: ['inventory.view'] },
      { key: 'reports', label: 'Reports', icon: 'reports', permissions: ['reports.view'] },
      { key: 'users', label: 'Users & Roles', icon: 'users', permissions: ['users.view'] },
      { key: 'settings', label: 'Settings', icon: 'settings', permissions: ['settings.view'] },
      { key: 'audit', label: 'Audit Logs', icon: 'audit', permissions: ['audit.view_logs'] },
      { key: 'expenses', label: 'Expenses', icon: 'expenses', permissions: ['expenses.view'] }
    ];

    return menuItems.filter(item => this.hasAnyPermission(item.permissions));
  }

  // Get action buttons user can see
  getActionButtons(context: string) {
    interface ActionItem {
      key: string;
      label: string;
      permissions: string[];
    }
    
    const actionPermissions: Record<string, ActionItem[]> = {
      'user-list': [
        { key: 'create', label: 'Add User', permissions: ['users.create'] },
        { key: 'edit', label: 'Edit', permissions: ['users.edit'] },
        { key: 'delete', label: 'Delete', permissions: ['users.delete'] },
        { key: 'manage', label: 'Manage', permissions: ['users.manage'] }
      ],
      'product-list': [
        { key: 'create', label: 'Add Product', permissions: ['products.create'] },
        { key: 'edit', label: 'Edit', permissions: ['products.edit'] },
        { key: 'delete', label: 'Delete', permissions: ['products.delete'] }
      ],
      'sale-list': [
        { key: 'create', label: 'New Sale', permissions: ['sales.create'] },
        { key: 'edit', label: 'Edit', permissions: ['sales.edit'] },
        { key: 'delete', label: 'Delete', permissions: ['sales.delete'] }
      ],
      'customer-list': [
        { key: 'create', label: 'Add Customer', permissions: ['customers.create'] },
        { key: 'edit', label: 'Edit', permissions: ['customers.edit'] },
        { key: 'delete', label: 'Delete', permissions: ['customers.delete'] }
      ],
      'inventory-list': [
        { key: 'create', label: 'Add Item', permissions: ['inventory.create'] },
        { key: 'edit', label: 'Edit', permissions: ['inventory.edit'] },
        { key: 'delete', label: 'Delete', permissions: ['inventory.delete'] }
      ]
    };

    const actions = actionPermissions[context] || [];
    return actions.filter(action => this.hasAnyPermission(action.permissions));
  }

  // Get current user permissions
  getUserPermissions(): string[] {
    return this.userPermissions;
  }

  // Get current user role
  getUserRole(): string {
    return this.userRole;
  }
}

// React Hook for permissions
export const usePermissions = () => {
  const permissionService = new PermissionService();
  
  // Initialize from user context/auth
  const initializePermissions = (user: any) => {
    permissionService.setUserPermissions(user.permissions || [], user.role?.name || '');
  };

  return {
    hasPermission: (permission: string) => permissionService.hasPermission(permission),
    hasAnyPermission: (permissions: string[]) => permissionService.hasAnyPermission(permissions),
    hasAllPermissions: (permissions: string[]) => permissionService.hasAllPermissions(permissions),
    hasRole: (role: string) => permissionService.hasRole(role),
    hasAnyRole: (roles: string[]) => permissionService.hasAnyRole(roles),
    getVisibleComponents: () => permissionService.getVisibleComponents(),
    getMenuItems: () => permissionService.getMenuItems(),
    getActionButtons: (context: string) => permissionService.getActionButtons(context),
    getUserPermissions: () => permissionService.getUserPermissions(),
    getUserRole: () => permissionService.getUserRole(),
    initializePermissions
  };
};

// Permission constants for consistency
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_SALES_VIEW: 'dashboard.sales_view',
  DASHBOARD_FINANCIAL_VIEW: 'dashboard.financial_view',
  
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE: 'users.manage',
  
  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  
  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',
  
  // Sales
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_EDIT: 'sales.edit',
  SALES_DELETE: 'sales.delete',
  
  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_EDIT: 'inventory.edit',
  INVENTORY_DELETE: 'inventory.delete',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  
  // Settings
  SETTINGS_VIEW: 'settings.view',
  
  // Audit
  AUDIT_VIEW_LOGS: 'audit.view_logs',
  
  // Expenses
  EXPENSES_VIEW: 'expenses.view'
};

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES: 'sales',
  CASHIER: 'cashier',
  VIEWER: 'viewer'
};