"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PermissionService, PERMISSIONS, ROLES } from '@/services/permissions';

interface User {
  id: string;
  role?: {
    name: string;
    permissions?: string[];
  } | string;
  permissions?: string[];
  firstName?: string;
  lastName?: string;
  email: string;
  profileImage?: string;
  avatar?: string;
  username?: string;
  name?: string;
}

interface PermissionsContextType {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getVisibleComponents: () => string[];
  getMenuItems: () => { key: string; label: string; permissions: string[]; icon: string }[];
  getActionButtons: (context: string) => { key: string; label: string; permissions: string[] }[];
  initializePermissions: (user: User) => void;
  user: User | null;
  getUserRole: () => string;
  getUserPermissions: () => string[];
  isInitialized: boolean;
}

const PermissionsContext = React.createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [permissionService] = useState(new PermissionService());
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializePermissions = useMemo(() => (userData: User) => {
    setUser(userData);
    let roleName = "Guest";
    let userPermissions: string[] = [];

    if (userData.role) {
      roleName = typeof userData.role === 'object' ? userData.role.name || 'Guest' : userData.role;
    }

    if (userData.permissions && userData.permissions.length > 0) {
      // Use permissions directly from the user data
      // Our enhanced permission checking will handle the format conversion
      userPermissions = userData.permissions;
    } else if (typeof userData.role === 'object' && userData.role.permissions) {
      userPermissions = userData.role.permissions;
    } else {
      // Fallback to default permissions based on role if no explicit permissions are provided
      userPermissions = getDefaultPermissionsForRole(roleName);
    }

    permissionService.setUserPermissions(userPermissions, roleName);
    setIsInitialized(true);
  }, []);

  const getUserRole = useMemo(() => () => {
    return permissionService.hasRole('') ? 'Guest' : permissionService.getUserRole();
  }, [permissionService]);

  const getUserPermissions = useMemo(() => () => {
    return permissionService.getUserPermissions();
  }, [permissionService]);

  // Define default permissions for roles if not explicitly provided by backend
  const getDefaultPermissionsForRole = (role: string): string[] => {
    switch (role.toLowerCase()) {
      case 'admin':
        return [
          'dashboard.view', 'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
          'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
          'products.view', 'products.create', 'products.edit', 'products.delete',
          'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
          'reports.view', 'reports.generate',
          'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage',
          'settings.view', 'settings.edit',
          'audit.view_logs',
          'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete'
        ];
      case 'manager':
        return [
          'dashboard.view', 'sales.view', 'sales.create', 'sales.edit',
          'customers.view', 'customers.create', 'customers.edit',
          'products.view', 'products.create', 'products.edit',
          'inventory.view', 'inventory.create', 'inventory.edit',
          'reports.view', 'reports.generate',
          'settings.view',
          'expenses.view', 'expenses.create', 'expenses.edit'
        ];
      case 'sales_staff':
        return [
          'dashboard.view', 'sales.view', 'sales.create', 'sales.edit',
          'customers.view', 'customers.create', 'customers.edit',
          'products.view',
          'inventory.view',
          'expenses.view'
        ];
      case 'viewer':
        return [
          'dashboard.view', 'sales.view', 'customers.view', 'products.view',
          'inventory.view', 'reports.view', 'expenses.view'
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    // Attempt to initialize permissions from localStorage on mount
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsedUserData: User = JSON.parse(storedUserData);
        initializePermissions(parsedUserData);
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        // Optionally, clear invalid data
        localStorage.removeItem('userData');
      }
    }
  }, [initializePermissions]);

  const contextValue = useMemo(() => ({
    hasPermission: permissionService.hasPermission.bind(permissionService),
    hasAnyPermission: permissionService.hasAnyPermission.bind(permissionService),
    hasAllPermissions: permissionService.hasAllPermissions.bind(permissionService),
    hasRole: permissionService.hasRole.bind(permissionService),
    hasAnyRole: permissionService.hasAnyRole.bind(permissionService),
    getVisibleComponents: permissionService.getVisibleComponents.bind(permissionService),
    getMenuItems: permissionService.getMenuItems.bind(permissionService),
    getActionButtons: permissionService.getActionButtons.bind(permissionService),
    initializePermissions,
    user,
    getUserRole,
    getUserPermissions,
    isInitialized,
  }), [
    permissionService, 
    initializePermissions, 
    user, 
    getUserRole, 
    getUserPermissions, 
    isInitialized
  ]);

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = React.useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

// Higher-order component for permission-based rendering
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions?: string[],
  requiredRole?: string
) {
  function PermissionWrapper(props: P) {
    const { hasAnyPermission, hasRole, isInitialized } = usePermissions();

    if (!isInitialized) {
      return <div>Loading...</div>;
    }

    // Check permissions
    if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
      return (
        <div className="no-access">
          <h2>Access Restricted</h2>
          <p>You don't have permission to view this content.</p>
          <p>Contact your administrator for access.</p>
        </div>
      );
    }

    // Check role
    if (requiredRole && !hasRole(requiredRole)) {
      return (
        <div className="no-access">
          <h2>Access Restricted</h2>
          <p>You don't have the required role to view this content.</p>
          <p>Contact your administrator for access.</p>
        </div>
      );
    }

    return <Component {...props} />;
  }
  
  return PermissionWrapper;
}

// Permission guard component
interface PermissionGuardProps {
  permissions?: string[];
  roles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissions,
  roles,
  children,
  fallback = null
}) => {
  const { hasAnyPermission, hasAnyRole, isInitialized } = usePermissions();

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  if (permissions && !hasAnyPermission(permissions)) {
    return fallback;
  }

  if (roles && !hasAnyRole(roles)) {
    return fallback;
  }

  return <>{children}</>;
};

// Export constants for ease of use
export {
  PERMISSIONS,
  ROLES
};