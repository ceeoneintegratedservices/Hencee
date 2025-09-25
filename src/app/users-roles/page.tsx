'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import { NotificationContainer, useNotifications } from '@/components/Notification';
import TimePeriodSelector from '@/components/TimePeriodSelector';

interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
}

interface PermissionMatrix {
  [roleId: string]: {
    [permissionKey: string]: boolean;
  };
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  roleId: string;
}

const PERMISSION_ENTITIES = [
  'Dashboard',
  'Orders',
  'Inventory',
  'Reports',
  'Customers',
  'Settings',
  'Approvals',
  'Audits',
  'Expenses',
  'Users & Roles'
];

const PERMISSION_ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Approve'];

function buildPermissionKey(entity: string, action: string) {
  return `${entity}:${action}`;
}

export default function UsersRolesPage() {
  const { notifications, removeNotification, showSuccess } = useNotifications();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // UI: user permission drawer/modal
  const [showUserPermissions, setShowUserPermissions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  const defaultRoles: Role[] = useMemo(() => ([
    { id: 'admin', name: 'Administrator', description: 'Full access to all features', isSystem: true },
    { id: 'manager', name: 'Manager', description: 'Manage operations and approvals' },
    { id: 'sales', name: 'Sales', description: 'Manage orders and customers' },
    { id: 'inventory', name: 'Inventory', description: 'Manage inventory only' }
  ]), []);

  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('admin');
  const [users, setUsers] = useState<AppUser[]>([
    { id: 'u1', name: 'Admin User', email: 'admin@company.com', status: 'Active', roleId: 'admin' },
    { id: 'u2', name: 'Mary Johnson', email: 'mary@company.com', status: 'Active', roleId: 'manager' },
    { id: 'u3', name: 'Ken Obi', email: 'ken@company.com', status: 'Inactive', roleId: 'sales' },
    { id: 'u4', name: 'James Doe', email: 'james@company.com', status: 'Active', roleId: 'inventory' }
  ]);

  // Users filters & pagination (must be declared before any conditional returns)
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('All');
  const [userStatusFilter, setUserStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [userPageSize, setUserPageSize] = useState<number>(10);
  const [userPage, setUserPage] = useState<number>(1);
  const [timePeriod, setTimePeriod] = useState<"This Week" | "This Month">("This Week");

  // Per-user permission overrides. If a key exists here, it overrides the role matrix for that user.
  const [userPermissionOverrides, setUserPermissionOverrides] = useState<{
    [userId: string]: { [permissionKey: string]: boolean }
  }>({});

  const buildDefaultMatrix = (): PermissionMatrix => {
    const matrix: PermissionMatrix = {};
    
    // Create permissions for visible roles
    for (const role of defaultRoles) {
      matrix[role.id] = {};
      for (const entity of PERMISSION_ENTITIES) {
        for (const action of PERMISSION_ACTIONS) {
          const key = buildPermissionKey(entity, action);
          // Admin full, others sensible defaults
          if (role.id === 'admin') matrix[role.id][key] = true;
          else if (role.id === 'inventory') {
            matrix[role.id][key] = entity === 'Inventory' ? action !== 'Approve' : action === 'View';
          } else if (role.id === 'sales') {
            matrix[role.id][key] = (entity === 'Orders' || entity === 'Customers') ? action !== 'Approve' : action === 'View';
          } else if (role.id === 'manager') {
            matrix[role.id][key] = ['Orders', 'Inventory', 'Approvals', 'Reports', 'Customers'].includes(entity) ? action !== 'Delete' : action === 'View';
          } else {
            matrix[role.id][key] = false;
          }
        }
      }
    }
    
    // Create hidden viewer permissions (for fallback when roles are deleted and for permission overrides)
    matrix['viewer'] = {};
    for (const entity of PERMISSION_ENTITIES) {
      for (const action of PERMISSION_ACTIONS) {
        const key = buildPermissionKey(entity, action);
        matrix['viewer'][key] = action === 'View';
      }
    }
    
    return matrix;
  };

  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>(buildDefaultMatrix);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  // Load saved state
  useEffect(() => {
    const raw = localStorage.getItem('usersRolesState');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.roles) {
          // Remove viewer role from loaded roles
          const filteredRoles = parsed.roles.filter((r: Role) => r.id !== 'viewer');
          setRoles(filteredRoles);
        }
        if (parsed.users) {
          // Reassign any users with viewer roleId to admin
          const updatedUsers = parsed.users.map((u: AppUser) => 
            u.roleId === 'viewer' ? { ...u, roleId: 'admin' } : u
          );
          setUsers(updatedUsers);
        }
        if (parsed.permissionMatrix) setPermissionMatrix(parsed.permissionMatrix);
        if (parsed.userPermissionOverrides) setUserPermissionOverrides(parsed.userPermissionOverrides);
      } catch {}
    }
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem('usersRolesState', JSON.stringify({ roles, users, permissionMatrix, userPermissionOverrides }));
  }, [roles, users, permissionMatrix, userPermissionOverrides]);

  // Role management actions (still available for admin use via creation/clone/delete; hidden from main layout)
  const handleCreateRole = () => {
    const name = prompt('Enter new role name');
    if (!name) return;
    const id = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (roles.some(r => r.id === id)) return alert('Role with same id exists');
    const newRole: Role = { id, name, description: '' };
    const newRoles = [...roles, newRole];
    const newMatrix: PermissionMatrix = { ...permissionMatrix, [id]: { ...permissionMatrix['viewer'] } };
    setRoles(newRoles);
    setPermissionMatrix(newMatrix);
    setSelectedRoleId(id);
    showSuccess('Role created', `${name} added`);
  };

  const handleCloneRole = (sourceId: string) => {
    const source = roles.find(r => r.id === sourceId);
    if (!source) return;
    const name = prompt('New role name (clone of ' + source.name + ')');
    if (!name) return;
    const id = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (roles.some(r => r.id === id)) return alert('Role with same id exists');
    const newRole: Role = { id, name, description: source.description };
    const newRoles = [...roles, newRole];
    const newMatrix: PermissionMatrix = { ...permissionMatrix, [id]: { ...permissionMatrix[sourceId] } };
    setRoles(newRoles);
    setPermissionMatrix(newMatrix);
    setSelectedRoleId(id);
    showSuccess('Role cloned', `${name} created`);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role || role.isSystem) return alert('Cannot delete system role');
    if (!confirm(`Delete role ${role.name}?`)) return;
    const newRoles = roles.filter(r => r.id !== roleId);
    const { [roleId]: _, ...restMatrix } = permissionMatrix;
    // Reassign users of deleted role to admin (since viewer is not a visible role)
    const newUsers = users.map(u => (u.roleId === roleId ? { ...u, roleId: 'admin' } : u));
    setRoles(newRoles);
    setPermissionMatrix(restMatrix);
    setUsers(newUsers);
    setSelectedRoleId('admin');
    showSuccess('Role deleted', `${role.name} removed`);
  };

  // Helpers for effective permissions for a user
  const getEffectivePermission = (user: AppUser, key: string): boolean => {
    const overrides = userPermissionOverrides[user.id];
    if (overrides && key in overrides) return !!overrides[key];
    return !!permissionMatrix[user.roleId]?.[key];
  };

  const toggleUserPermission = (user: AppUser, key: string) => {
    setUserPermissionOverrides(prev => {
      const userMap = { ...(prev[user.id] || {}) };
      const current = getEffectivePermission(user, key);
      userMap[key] = !current;
      return { ...prev, [user.id]: userMap };
    });
  };

  const resetUserPermissionsToRole = (user: AppUser) => {
    setUserPermissionOverrides(prev => {
      const clone = { ...prev };
      delete clone[user.id];
      return clone;
    });
    showSuccess('Reset', `Permissions reset to role defaults for ${user.name}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleTogglePermission = (roleId: string, key: string) => {
    setPermissionMatrix(prev => ({
      ...prev,
      [roleId]: { ...prev[roleId], [key]: !prev[roleId][key] }
    }));
  };

  const handleAssignRole = (userId: string, roleId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, roleId } : u));
    showSuccess('Updated', 'User role updated');
  };

  // Bulk permission helpers
  const handleToggleEntityAll = (roleId: string, entity: string, next: boolean) => {
    setPermissionMatrix(prev => {
      const updated = { ...prev };
      const currentRole = { ...(updated[roleId] || {}) };
      for (const action of PERMISSION_ACTIONS) {
        currentRole[buildPermissionKey(entity, action)] = next;
      }
      updated[roleId] = currentRole;
      return updated;
    });
  };

  const handleToggleActionAll = (roleId: string, action: string, next: boolean) => {
    setPermissionMatrix(prev => {
      const updated = { ...prev };
      const currentRole = { ...(updated[roleId] || {}) };
      for (const entity of PERMISSION_ENTITIES) {
        currentRole[buildPermissionKey(entity, action)] = next;
      }
      updated[roleId] = currentRole;
      return updated;
    });
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = userSearch.trim() ?
      (u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
      : true;
    const matchesRole = userRoleFilter === 'All' ? true : u.roleId === userRoleFilter;
    const matchesStatus = userStatusFilter === 'All' ? true : u.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const safeUserPage = Math.min(Math.max(1, userPage), totalUserPages);
  const userStart = (safeUserPage - 1) * userPageSize;
  const userEnd = userStart + userPageSize;
  const pagedUsers = filteredUsers.slice(userStart, userEnd);

  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden">
      <Sidebar currentPage="users_roles" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 h-screen overflow-y-auto transition-all duration-300 relative">
        <Header title="Users & Roles" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="p-4 sm:p-6">
          <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Users & Roles', href: '/users-roles' }]} />

          {/* Summary Row */}
          <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-gray-900">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3l2.5 4.5L20 9l-4 3.5L17 18l-5-2.5L7 18l1-5.5L4 9l5.5-1.5L12 3z"/></svg>
                </div>
                <TimePeriodSelector 
                  selectedTimePeriod={timePeriod}
                  onTimePeriodChange={setTimePeriod}
                  textColor="#6b7280"
                  iconColor="#6b7280"
                />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-500 text-sm">Logins</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Active Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">New Users</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-gray-900">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3l2.5 4.5L20 9l-4 3.5L17 18l-5-2.5L7 18l1-5.5L4 9l5.5-1.5L12 3z"/></svg>
                </div>
                <TimePeriodSelector 
                  selectedTimePeriod={timePeriod}
                  onTimePeriodChange={setTimePeriod}
                  textColor="#6b7280"
                  iconColor="#6b7280"
                />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-500 text-sm">Inactive Users</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Password Resets</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Role Changes</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-gray-900">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7h18M6 12h12M8 17h8"/></svg>
                </div>
                <TimePeriodSelector 
                  selectedTimePeriod={timePeriod}
                  onTimePeriodChange={setTimePeriod}
                  textColor="#6b7280"
                  iconColor="#6b7280"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Top User</p>
                  <p className="text-gray-900">{users[0]?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-rose-600 font-medium">Less User</p>
                  <p className="text-gray-900">{users[1]?.name || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Users table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
            <div className="p-6 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="All">All Roles</option>
                  {roles.filter(r => r.id !== 'viewer').map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <select
                  value={userStatusFilter}
                  onChange={(e) => { setUserStatusFilter(e.target.value as any); setUserPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <select
                  value={userPageSize}
                  onChange={(e) => { setUserPageSize(parseInt(e.target.value)); setUserPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedUser(u); setShowUserPermissions(true); }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{u.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${u.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={u.roleId}
                          onChange={(e) => handleAssignRole(u.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {roles.filter(r => r.id !== 'viewer').map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => {
                            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: x.status === 'Active' ? 'Inactive' : 'Active' } : x));
                            showSuccess('Updated', 'User status changed');
                          }}
                          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                        >
                          {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Users pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600">Page {safeUserPage} of {totalUserPages} · Showing {filteredUsers.length === 0 ? 0 : userStart + 1}-{Math.min(userEnd, filteredUsers.length)} of {filteredUsers.length}</div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50" onClick={() => setUserPage(1)} disabled={safeUserPage === 1}>First</button>
                <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50" onClick={() => setUserPage(safeUserPage - 1)} disabled={safeUserPage === 1}>Prev</button>
                <span className="text-sm text-gray-600 px-2">{safeUserPage}</span>
                <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50" onClick={() => setUserPage(safeUserPage + 1)} disabled={safeUserPage === totalUserPages}>Next</button>
                <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50" onClick={() => setUserPage(totalUserPages)} disabled={safeUserPage === totalUserPages}>Last</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <NotificationContainer notifications={notifications} onRemove={removeNotification} />

      {/* User Permissions Drawer/Modal */}
      {showUserPermissions && selectedUser && (
        <div className="fixed inset-0 z-50 flex" onClick={(e) => { if (e.target === e.currentTarget) setShowUserPermissions(false); }}>
          <div className="ml-auto h-full w-full max-w-2xl bg-white shadow-2xl border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Permissions for</p>
                <h3 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => resetUserPermissionsToRole(selectedUser)} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">Reset to role</button>
                <button onClick={() => setShowUserPermissions(false)} className="p-2 rounded hover:bg-gray-100" aria-label="Close">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {PERMISSION_ENTITIES.map(entity => (
                  <details key={entity} className="border rounded-lg">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none bg-gray-50">
                      <span className="text-sm font-medium text-gray-900">{entity}</span>
                      <span className="text-[11px] text-gray-500">{PERMISSION_ACTIONS.map(a => (getEffectivePermission(selectedUser, buildPermissionKey(entity, a)) ? a[0] : '-')).join(' ')}</span>
                    </summary>
                    <div className="px-4 py-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {PERMISSION_ACTIONS.map(action => {
                          const key = buildPermissionKey(entity, action);
                          const checked = getEffectivePermission(selectedUser, key);
                          return (
                            <label key={action} className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleUserPermission(selectedUser, key)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-700">{action}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
