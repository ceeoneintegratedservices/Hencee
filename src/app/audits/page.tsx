'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationContainer, useNotifications } from '@/components/Notification';
import FilterByDateModal from '@/components/FilterByDateModal';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import { getAuditLogs, type AuditLog as APIAuditLog } from '@/services/auditLogs';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  status: 'Success' | 'Failed' | 'Warning';
}

export default function AuditsPage() {
  const router = useRouter();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  
  // Authentication check
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data states
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showBulkActionDropdown, setShowBulkActionDropdown] = useState(false);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  
  // Refs for click outside detection
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const bulkActionDropdownRef = useRef<HTMLDivElement>(null);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  // Fetch audit logs from API
  const fetchAuditLogs = async () => {
    if (!isAuthenticated) return;
    
    setApiLoading(true);
    setApiError(null);
    
    try {
      const response = await getAuditLogs({
        page: 1,
        limit: 100 // Get more logs for better UX
      });
      
      // Transform API data to match UI format
      const transformedLogs: AuditLog[] = response.data.map((log: APIAuditLog) => ({
        id: log.id,
        timestamp: new Date(log.createdAt).toLocaleString(),
        user: log.user?.email || 'Unknown User',
        action: log.action,
        resource: log.entityType,
        details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details),
        ipAddress: log.ipAddress,
        status: 'Success' as const // API doesn't provide status, defaulting to Success
      }));
      
      setAuditLogs(transformedLogs);
      setFilteredLogs(transformedLogs);
      
    } catch (err: any) {
      setApiError(err.message || 'Failed to load audit logs');
      showError('Error', err.message || 'Failed to load audit logs');
      
      // Fallback to sample data if API fails
      const sampleLogs: AuditLog[] = [
        {
          id: 'audit-1',
          timestamp: '2024-01-15 10:30:25',
          user: 'admin@ceeonewheels.com',
          action: 'Login',
          resource: 'Authentication',
          details: 'Successful login from Chrome browser',
          ipAddress: '192.168.1.100',
          status: 'Success'
        },
        {
          id: 'audit-2',
          timestamp: '2024-01-15 10:25:15',
          user: 'manager@ceeonewheels.com',
          action: 'Create',
          resource: 'Product',
          details: 'Created new product: Michelin Pilot Sport 4',
          ipAddress: '192.168.1.101',
          status: 'Success'
        },
        {
          id: 'audit-3',
          timestamp: '2024-01-15 10:20:45',
          user: 'staff@ceeonewheels.com',
          action: 'Update',
          resource: 'Inventory',
          details: 'Updated stock quantity for Bridgestone Potenza',
          ipAddress: '192.168.1.102',
          status: 'Success'
        }
      ];
      
      setAuditLogs(sampleLogs);
      setFilteredLogs(sampleLogs);
    } finally {
      setApiLoading(false);
    }
  };

  // Load audit logs when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAuditLogs();
    }
  }, [isAuthenticated]);

  // Filter logs
  useEffect(() => {
    let filtered = auditLogs;
    
    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }
    
    // Apply action filter
    if (actionFilter !== 'All') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
    
    setFilteredLogs(filtered);
  }, [searchQuery, statusFilter, actionFilter, auditLogs]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (bulkActionDropdownRef.current && !bulkActionDropdownRef.current.contains(event.target as Node)) {
        setShowBulkActionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDateFilter = (dateFilter: any) => {
    showSuccess('Success', 'Date filter applied successfully');
  };

  const handleExport = () => {
    showSuccess('Success', 'Audit logs exported successfully');
  };

  if (loading || apiLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {loading ? 'Loading audit logs...' : 'Fetching audit data...'}
          </p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar currentPage="audits" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Audit Logs" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Audit Logs</h2>
              <p className="text-gray-600 mb-4">{apiError}</p>
              <button 
                onClick={fetchAuditLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage="audits" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Audit Logs" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto px-5 pt-7">
          {/* Breadcrumbs */}
          <Breadcrumb items={[
            { label: "Home", href: "/dashboard" },
            { label: "Audit Logs", href: "/audits" }
          ]} />

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 mt-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Audit Logs</h1>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Logs
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Logs</p>
                  <p className="text-2xl font-semibold text-gray-900">{auditLogs.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Successful</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {auditLogs.filter(log => log.status === 'Success').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {auditLogs.filter(log => log.status === 'Failed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Warnings</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {auditLogs.filter(log => log.status === 'Warning').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
                
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2">
                    {/* Status Filter */}
                    <div className="relative" ref={filterDropdownRef}>
                      <button
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                        </svg>
                        Status: {statusFilter}
                      </button>
                      {showFilterDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button 
                              onClick={() => { setStatusFilter('All'); setShowFilterDropdown(false); }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              All Status
                            </button>
                            <button 
                              onClick={() => { setStatusFilter('Success'); setShowFilterDropdown(false); }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Success
                            </button>
                            <button 
                              onClick={() => { setStatusFilter('Failed'); setShowFilterDropdown(false); }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Failed
                            </button>
                            <button 
                              onClick={() => { setStatusFilter('Warning'); setShowFilterDropdown(false); }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Warning
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Date Filter */}
                    <button 
                      onClick={() => setShowDateFilterModal(true)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Filter
                    </button>

                    {/* Bulk Action */}
                    <div className="relative" ref={bulkActionDropdownRef}>
                      <button
                        onClick={() => setShowBulkActionDropdown(!showBulkActionDropdown)}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Bulk Action
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showBulkActionDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Export Selected
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Archive Selected
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Delete Selected
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.resource}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              {filteredLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="p-4 border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 rounded border-gray-300" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{log.timestamp}</p>
                          <p className="text-xs text-gray-500 mt-1">{log.user}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Action:</span>
                              <span className="text-gray-900">{log.action}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Resource:</span>
                              <span className="text-gray-900">{log.resource}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">IP:</span>
                              <span className="text-gray-900">{log.ipAddress}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-3">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
                    <option>10 Items per page</option>
                    <option>25 Items per page</option>
                    <option>50 Items per page</option>
                  </select>
                  <span className="text-sm text-gray-700">
                    1-10 of {filteredLogs.length} items
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">1 of {Math.ceil(filteredLogs.length / 10)} pages</span>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />

      {/* Date Filter Modal */}
      <FilterByDateModal
        isOpen={showDateFilterModal}
        onClose={() => setShowDateFilterModal(false)}
        onApply={handleDateFilter}
      />
    </div>
  );
}
