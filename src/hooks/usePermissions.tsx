"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { PermissionService, getDefaultPermissions } from '@/services/permissions';

// User interface
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
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

// Permission context interface
interface PermissionsContextType {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getMenuItems: () => Array<{ key: string; label: string; permissions: string[]; icon: string }>;
  initializePermissions: (user: User) => void;
  user: User | null;
  getUserRole: () => string;
  getUserPermissions: () => string[];
  isInitialized: boolean;
}

// Default permission values when no provider is available
const defaultPermissions: PermissionsContextType = {
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  hasRole: () => false,
  hasAnyRole: () => false,
  getMenuItems: () => [],
  initializePermissions: () => {},
  user: null,
  getUserRole: () => '',
  getUserPermissions: () => [],
  isInitialized: false
};

// Create context with default values
const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Provider component
export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create a single instance of the permission service
  const [permissionService] = useState(() => new PermissionService());
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize permissions function - memoized to prevent re-renders
  const initializePermissions = useMemo(() => (userData: User) => {
    setUser(userData);
    
    // Determine role name
    let roleName = "guest";
    if (userData.role) {
      roleName = typeof userData.role === 'object' ? userData.role.name || 'guest' : userData.role;
    }
    
    // Try to get permissions from JWT token first (most up-to-date)
    let tokenPermissions: string[] = [];
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Decode JWT token to get permissions
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.permissions && Array.isArray(payload.permissions)) {
            tokenPermissions = payload.permissions;
          }
        }
      }
    } catch (e) {
      // If JWT decode fails, continue with other methods
      console.warn('Failed to decode JWT token for permissions:', e);
    }
    
    // Get permissions from user data or default to role-based permissions
    let userPermissions: string[] = [];
    // Prefer JWT token permissions as they're most current, then user permissions, then role permissions
    if (tokenPermissions.length > 0) {
      userPermissions = tokenPermissions;
    } else if (userData.permissions && userData.permissions.length > 0) {
      // Use permissions directly from user data
      userPermissions = userData.permissions;
    } else if (typeof userData.role === 'object' && userData.role.permissions && userData.role.permissions.length > 0) {
      userPermissions = userData.role.permissions;
    } else {
      // Fallback to default permissions based on role
      userPermissions = getDefaultPermissions(roleName);
    }
    
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
    
    // Set permissions in the service
    permissionService.setUserPermissions(userPermissions, roleName);
    setIsInitialized(true);
  }, [permissionService]);

  // Get user role - memoized
  const getUserRole = useMemo(() => () => {
    return permissionService.getUserRole();
  }, [permissionService]);

  // Get user permissions - memoized
  const getUserPermissions = useMemo(() => () => {
    return permissionService.getUserPermissions();
  }, [permissionService]);

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const parsedUserData: User = JSON.parse(storedUserData);
          initializePermissions(parsedUserData);
        }
      } catch (error) {
        console.error("Failed to load user data from localStorage", error);
        localStorage.removeItem('userData');
      }
    };
    
    loadUserData();
  }, [initializePermissions]);

  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    hasPermission: (permission: string) => permissionService.hasPermission(permission),
    hasAnyPermission: (permissions: string[]) => permissionService.hasAnyPermission(permissions),
    hasAllPermissions: (permissions: string[]) => permissionService.hasAllPermissions(permissions),
    hasRole: (role: string) => permissionService.hasRole(role),
    hasAnyRole: (roles: string[]) => permissionService.hasAnyRole(roles),
    getMenuItems: () => permissionService.getMenuItems(),
    initializePermissions,
    user,
    getUserRole,
    getUserPermissions,
    isInitialized
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

// Custom hook to use the permissions context
export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  
  // Return context if available, otherwise return default values
  // This prevents errors when the hook is used outside the provider
  return context || defaultPermissions;
};

// Permission guard component for conditional rendering
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
  try {
  const { hasAnyPermission, hasAnyRole, isInitialized } = usePermissions();

  if (!isInitialized) {
      return null;
  }

  if (permissions && !hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  if (roles && !hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
  } catch (e) {
    // If there's an error (e.g., provider not available), render nothing
    return null;
  }
};

// Higher-order component for permission-based component rendering
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions?: string[],
  requiredRole?: string
) {
  const WrappedComponent = (props: P) => {
    try {
      const { hasAnyPermission, hasRole, isInitialized } = usePermissions();

      if (!isInitialized) {
        return <div className="loading">Loading permissions...</div>;
      }

      if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
        return (
          <div className="access-denied">
            <h2>Access Restricted</h2>
            <p>You don't have permission to access this content.</p>
          </div>
        );
      }

      if (requiredRole && !hasRole(requiredRole)) {
        return (
          <div className="access-denied">
            <h2>Access Restricted</h2>
            <p>This content requires {requiredRole} role.</p>
          </div>
        );
      }

      return <Component {...props} />;
    } catch (e) {
      // If permissions provider is not available, render a loading state
      return <div className="loading">Initializing permissions...</div>;
    }
  };

  WrappedComponent.displayName = `WithPermissions(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
};
