'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationContainer, useNotifications } from '@/components/Notification';
import FilterByDateModal from '@/components/FilterByDateModal';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import { getApprovals, getPendingApprovals, approveRequest, rejectRequest, markRequestAsPaid } from '@/services/approvals';

interface ApprovalItem {
  id: string;
  type: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  requesterId: string;
  requesterName: string;
  approverId?: string;
  approverName?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidAt?: string;
  rejectionReason?: string;
  attachments?: string[];
}

export default function ApprovalsPage() {
  const router = useRouter();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  
  // Authentication check
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data states
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ApprovalItem[]>([]);
  
  // API state management
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
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

  // Fetch approvals from API
  const fetchApprovalsData = async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      const data = await getApprovals({ limit: 100 });
      // Handle both array response and { data: [] } response formats
      const approvalsArray = Array.isArray(data) ? data : ((data as any).data || []);
      
      // Debug: Log the actual structure of the API response
      if (process.env.NODE_ENV === 'development') {
        console.log('API Approvals Response:', data);
        console.log('Approvals Array:', approvalsArray);
      }
      
      // Map API response to ApprovalItem format
      const mappedItems = approvalsArray.map((item: any) => ({
        id: String(item.id || ''),
        type: String(item.category || item.type || 'expense'),
        title: String(item.description || item.title || 'Unknown Request'),
        description: String(item.description || ''),
        amount: Number(item.amount || 0),
        currency: String(item.currency || 'NGN'),
        status: String(item.status || 'pending'),
        requesterId: String(item.userId || item.requesterId || ''),
        requesterName: String(item.userName || item.requesterName || 'Unknown Requester'),
        approverId: item.approvedById ? String(item.approvedById) : undefined,
        approverName: item.approverName ? String(item.approverName) : undefined,
        createdAt: String(item.createdAt || new Date().toISOString()),
        updatedAt: String(item.updatedAt || new Date().toISOString()),
        approvedAt: item.approvedAt ? String(item.approvedAt) : undefined,
        rejectedAt: item.rejectedAt ? String(item.rejectedAt) : undefined,
        paidAt: item.paidAt ? String(item.paidAt) : undefined,
        rejectionReason: item.rejectionReason ? String(item.rejectionReason) : undefined,
        attachments: item.receiptUrl ? [item.receiptUrl] : (Array.isArray(item.attachments) ? item.attachments : []),
      }));
      
      setApprovalItems(mappedItems);
      setFilteredItems(mappedItems);
    } catch (err: any) {
      console.error('Error fetching approvals:', err);
      setApiError(err.message || 'Failed to load approvals');
      showError('Error', err.message || 'Failed to load approvals');
      
      // Keep existing data if API fails, don't clear it
      // setApprovalItems([]);
      // setFilteredItems([]);
    } finally {
      setApiLoading(false);
    }
  };

  // Load approvals data
  useEffect(() => {
    if (isAuthenticated) {
      fetchApprovalsData();
    }
  }, [isAuthenticated]);


  // Handle approval actions
  const handleApproveRequest = async (id: string, notes?: string) => {
    try {
      await approveRequest(id, { action: 'approve', notes });
      showSuccess('Success', 'Request approved successfully');
      await fetchApprovalsData();
    } catch (err: any) {
      console.error('Error approving request:', err);
      showError('Error', err.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (id: string, reason: string, notes?: string) => {
    try {
      await rejectRequest(id, { action: 'reject', rejectionReason: reason, notes });
      showSuccess('Success', 'Request rejected successfully');
      await fetchApprovalsData();
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      showError('Error', err.message || 'Failed to reject request');
    }
  };

  const handleMarkAsPaid = async (id: string, notes?: string) => {
    try {
      await markRequestAsPaid(id, { action: 'mark-paid', notes });
      showSuccess('Success', 'Request marked as paid successfully');
      await fetchApprovalsData();
    } catch (err: any) {
      console.error('Error marking request as paid:', err);
      showError('Error', err.message || 'Failed to mark request as paid');
    }
  };

  // Simple action handlers for the UI buttons
  const handleApprove = (id: string) => {
    handleApproveRequest(id);
  };

  const handleReject = (id: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      handleRejectRequest(id, reason);
    }
  };

  // Filter items
  useEffect(() => {
    let filtered = approvalItems;
    
    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    // Priority filter removed - not available in API
    
    setFilteredItems(filtered);
  }, [searchQuery, statusFilter, typeFilter, approvalItems]);

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
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  const handleDateFilter = (dateFilter: any) => {
    console.log('Date filter applied:', dateFilter);
    showSuccess('Success', 'Date filter applied successfully');
  };

  const handleExport = () => {
    showSuccess('Success', 'Approval items exported successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approval items...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage="approvals" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Approvals" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto px-5 pt-7">
          {/* Breadcrumbs */}
          <Breadcrumb items={[
            { label: "Home", href: "/dashboard" },
            { label: "Approvals", href: "/approvals" }
          ]} />

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 mt-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Approvals</h1>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Items
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
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-semibold text-gray-900">{approvalItems.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {approvalItems.filter(item => item.status === 'Pending').length}
                  </p>
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
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {approvalItems.filter(item => item.status === 'Approved').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {approvalItems.filter(item => item.status === 'Rejected').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Approval Items Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Approval Items</h2>
                
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search items..."
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
                              onClick={() => { setStatusFilter('Pending'); setShowFilterDropdown(false); }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Pending
                            </button>
                            <button 
                              onClick={() => { setStatusFilter('Approved'); setShowFilterDropdown(false); }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Approved
                            </button>
                            <button 
                              onClick={() => { setStatusFilter('Rejected'); setShowFilterDropdown(false); }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Rejected
                            </button>
                            <button 
                              onClick={() => { setStatusFilter('Under Review'); setShowFilterDropdown(false); }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Under Review
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
                              Approve Selected
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Reject Selected
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Export Selected
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
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount/Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02016a]"></div>
                          <span className="ml-2 text-gray-600">Loading approvals...</span>
                        </div>
                      </td>
                    </tr>
                  ) : apiError ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center">
                        <div className="text-red-600">
                          <p className="font-medium">Error loading approvals</p>
                          <p className="text-sm mt-1">{apiError}</p>
                          <button 
                            onClick={fetchApprovalsData}
                            className="mt-2 px-4 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No approval requests found</p>
                          <p className="text-sm mt-1">Create your first approval request to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.requesterName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor('Medium')}`}>
                          Medium
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.amount && `₦${item.amount.toLocaleString()}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(item.id)}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {item.status !== 'Pending' && (
                          <span className="text-xs text-gray-500">Completed</span>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              {apiLoading ? (
                <div className="p-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02016a]"></div>
                    <span className="ml-2 text-gray-600">Loading approvals...</span>
                  </div>
                </div>
              ) : apiError ? (
                <div className="p-8 text-center">
                  <div className="text-red-600">
                    <p className="font-medium">Error loading approvals</p>
                    <p className="text-sm mt-1">{apiError}</p>
                    <button 
                      onClick={fetchApprovalsData}
                      className="mt-2 px-4 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-500">
                    <p className="font-medium">No approval requests found</p>
                    <p className="text-sm mt-1">Create your first approval request to get started</p>
                  </div>
                </div>
              ) : (
                filteredItems.slice(0, 10).map((item) => (
                <div key={item.id} className="p-4 border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 rounded border-gray-300" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.type} • {item.requesterName}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Amount:</span>
                              <span className="text-gray-900">
                                {item.amount && `₦${item.amount.toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-3 flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          {item.status === 'Pending' && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleApprove(item.id)}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(item.id)}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                ))
              )}
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
                    1-10 of {filteredItems.length} items
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">1 of {Math.ceil(filteredItems.length / 10)} pages</span>
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
