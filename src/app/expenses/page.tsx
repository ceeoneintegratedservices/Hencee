'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ExpensesDataService, ExpenseItem, ExpenseSummary } from '@/services/ExpensesDataService';
import { NotificationContainer, useNotifications } from '@/components/Notification';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import AddExpenseModal from '@/components/AddExpenseModal';
import ExpenseDetailsModal from '@/components/ExpenseDetailsModal';
import { listExpenses, createExpense, updateExpense, deleteExpense, getExpenseCategories, getExpenseDepartments, type Expense as APIExpense, type CreateExpensePayload, type ExpenseCategoryCode } from '@/services/expenses';

export default function ExpensesPage() {
  const router = useRouter();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  
  // Authentication check
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Data states
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [summaryData, setSummaryData] = useState<ExpenseSummary | null>(null);
  const [filteredItems, setFilteredItems] = useState<ExpenseItem[]>([]);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('requestDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<'This Week' | 'This Month'>('This Week');
  
  // Pagination
  const PAGE_SIZE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dropdown states
  const [showStatusDropdown, setShowStatusDropdown] = useState<number | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showBulkActionDropdown, setShowBulkActionDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  
  // Refs for click outside detection
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const departmentDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const bulkActionDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  // Fetch expenses from API
  const fetchExpenses = async () => {
    if (!isAuthenticated) return;
    
    setApiLoading(true);
    setApiError(null);
    
    try {
      const response = await listExpenses({
        page: 1,
        limit: 100 // Get more expenses for better UX
      });
      
      // Transform API data to match UI format
      const expensesArray = response.expenses || [];
      const transformedExpenses: ExpenseItem[] = expensesArray.map((expense: APIExpense) => ({
        id: expense.id,
        title: expense.title,
        description: expense.description,
        amount: expense.amount,
        currency: '₦', // Default currency
        category: expense.category,
        department: expense.department || 'N/A',
        priority: expense.priority === 'LOW' ? 'Low' : 
                  expense.priority === 'MEDIUM' ? 'Medium' : 
                  expense.priority === 'HIGH' ? 'High' : expense.priority,
        status: expense.status === 'PENDING' ? 'Pending' : 
                expense.status === 'APPROVED' ? 'Approved' : 
                expense.status === 'REJECTED' ? 'Rejected' : 
                expense.status === 'PAID' ? 'Paid' : expense.status,
        requestDate: expense.createdAt,
        requestedBy: expense.user?.name || 'Unknown User',
        requestedByEmail: expense.user?.email || 'unknown@example.com',
        approvedDate: expense.approvedAt,
        approvedBy: expense.approvedBy || (expense.approvedById ? 'Approved by Admin' : undefined),
        receiptImage: expense.receiptUrl,
        tags: expense.tags || [],
        // Additional fields that might be needed
        rejectionReason: expense.rejectionReason,
        decisionDate: expense.approvedAt || expense.updatedAt,
        vendor: expense.vendor || 'Unknown Vendor',
        invoiceNumber: expense.invoiceNumber || `INV-${expense.id.slice(-6)}`
      }));
      
      setExpenseItems(transformedExpenses);
      setFilteredItems(transformedExpenses);
      
      // Generate summary from API data
      const summary = ExpensesDataService.generateExpenseSummary(transformedExpenses);
      setSummaryData(summary);
      
    } catch (err: any) {
      setApiError(err.message || 'Failed to load expenses');
      showError('Error', err.message || 'Failed to load expenses');
      
      // No fallback - show empty state instead
      setExpenseItems([]);
      setFilteredItems([]);
      setSummaryData(null);
    } finally {
      setApiLoading(false);
    }
  };

  // Load expenses when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchExpenses();
    }
  }, [isAuthenticated]);

  // Filter and search items
  useEffect(() => {
    let filtered = expenseItems;
    
    // Apply search
    filtered = ExpensesDataService.searchExpenses(filtered, searchQuery);
    
    // Apply status filter
    filtered = ExpensesDataService.filterExpensesByStatus(filtered, statusFilter);
    
    // Apply category filter
    filtered = ExpensesDataService.filterExpensesByCategory(filtered, categoryFilter);
    
    // Apply department filter
    filtered = ExpensesDataService.filterExpensesByDepartment(filtered, departmentFilter);
    
    // Apply priority filter
    filtered = ExpensesDataService.filterExpensesByPriority(filtered, priorityFilter);
    
    // Apply sorting
    filtered = ExpensesDataService.sortExpenses(filtered, sortBy, sortOrder);
    
    setFilteredItems(filtered);
    // Reset to first page on any filter/sort/search change
    setCurrentPage(1);
  }, [expenseItems, searchQuery, statusFilter, categoryFilter, departmentFilter, priorityFilter, sortBy, sortOrder]);

  // Compute paginated items
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pagedItems = filteredItems.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    const next = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(next);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target)) {
        setShowStatusDropdown(null);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(target)) {
        setShowFilterDropdown(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setShowCategoryDropdown(false);
      }
      if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(target)) {
        setShowDepartmentDropdown(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(target)) {
        setShowPriorityDropdown(false);
      }
      if (bulkActionDropdownRef.current && !bulkActionDropdownRef.current.contains(target)) {
        setShowBulkActionDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleStatusChange = (expenseId: string, newStatus: string) => {
    setExpenseItems(prev => prev.map(item => 
      item.id === expenseId ? { ...item, status: newStatus as any } : item
    ));
    setShowStatusDropdown(null);
    showSuccess('Success', `Expense status updated to ${newStatus}`);
  };

  const handleApproveExpense = (expenseId: string) => {
    const updatedExpense = ExpensesDataService.approveExpense(expenseId, 'Admin User');
    if (updatedExpense) {
      setExpenseItems(prev => prev.map(item => 
        item.id === expenseId ? updatedExpense : item
      ));
      showSuccess('Success', 'Expense approved successfully');
    }
  };

  const handleRejectExpense = (expenseId: string) => {
    const rejectionReason = prompt('Please provide a reason for rejection:');
    if (rejectionReason) {
      const updatedExpense = ExpensesDataService.rejectExpense(expenseId, rejectionReason);
      if (updatedExpense) {
        setExpenseItems(prev => prev.map(item => 
          item.id === expenseId ? updatedExpense : item
        ));
        showSuccess('Success', 'Expense rejected');
      }
    }
  };

  const handleAddExpense = async (newExpense: ExpenseItem) => {
    try {
      const payload: CreateExpensePayload = {
        title: newExpense.title,
        description: newExpense.description,
        amount: newExpense.amount,
        category: newExpense.category as ExpenseCategoryCode,
        department: newExpense.department,
        priority: (newExpense.priority === 'Low' ? 'LOW' : newExpense.priority === 'Medium' ? 'MEDIUM' : 'HIGH'),
        vendor: newExpense.vendor,
        invoiceNumber: newExpense.invoiceNumber,
        tags: newExpense.tags || [],
        receiptUrl: newExpense.receiptImage,
        notes: undefined
      };

      const created = await createExpense(payload);
      // Normalize and add to list optimistically
      const createdTransformed: ExpenseItem = {
        id: created.id,
        title: created.title,
        description: created.description,
        amount: created.amount,
        currency: '₦',
        category: created.category,
        department: created.department || 'N/A',
        priority: ((created as any).priority === 'LOW' || (created as any).priority === 'MEDIUM' || (created as any).priority === 'HIGH'
          ? ({ LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' } as any)[(created as any).priority]
          : (created as any).priority) as any,
        status: created.status === 'PAID' ? 'Paid' : 
                created.status === 'PENDING' ? 'Pending' :
                created.status === 'APPROVED' ? 'Approved' :
                created.status === 'REJECTED' ? 'Rejected' : created.status,
        requestDate: created.createdAt,
        requestedBy: created.user.name,
        requestedByEmail: created.user.email,
        approvedDate: created.approvedAt,
        approvedBy: created.approvedBy,
        receiptImage: (created as any).receiptUrl,
        tags: (created as any).tags || [],
        rejectionReason: created.status === 'REJECTED' ? 'Rejected by approver' : undefined,
        decisionDate: created.approvedAt || created.updatedAt,
        vendor: (created as any).vendor || 'Unknown Vendor',
        invoiceNumber: (created as any).invoiceNumber || `INV-${created.id.slice(-6)}`
      };

      setExpenseItems(prev => [createdTransformed, ...prev]);
      setFilteredItems(prev => [createdTransformed, ...prev]);
      setSummaryData(prev => (prev ? ExpensesDataService.generateExpenseSummary([createdTransformed, ...expenseItems]) : prev));
      showSuccess('Success', 'Expense created successfully');
    } catch (error: any) {
      showError('Create failed', error?.message || 'Unable to create expense');
    }
  };

  const handleViewDetails = (expense: ExpenseItem) => {
    setSelectedExpense(expense);
    setShowDetailsModal(true);
  };

  const handleToggleDecision = (expense: ExpenseItem, target: 'Approved' | 'Rejected') => {
    // Gate by 1-hour window
    if (!ExpensesDataService.canToggleDecision(expense)) {
      showError('Not allowed', 'Toggle window expired (1 hour).');
      return;
    }
    
    const updated: ExpenseItem = {
      ...expense,
      status: target,
      approvedBy: target === 'Approved' ? 'Admin User' : expense.approvedBy,
      approvedDate: target === 'Approved' ? new Date().toISOString() : expense.approvedDate,
      rejectionReason: target === 'Rejected' ? (expense.rejectionReason || 'Toggled by admin') : undefined,
      decisionDate: new Date().toISOString()
    };
    setExpenseItems(prev => prev.map(it => it.id === expense.id ? updated : it));
    setSelectedExpense(updated);
    showSuccess('Updated', `Expense toggled to ${target}.`);
  };

  if (loading || apiLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {loading ? 'Loading...' : 'Fetching expenses data...'}
          </p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex w-full h-screen bg-gray-50 overflow-hidden">
        <Sidebar currentPage="expenses" sidebarOpen={showSidebar} setSidebarOpen={setShowSidebar} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Expenses</h2>
            <p className="text-gray-600 mb-4">{apiError}</p>
            <button 
              onClick={fetchExpenses}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar currentPage="expenses" sidebarOpen={showSidebar} setSidebarOpen={setShowSidebar} />
      
      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto transition-all duration-300 relative">
        <Header 
          title="Company Expenses" 
          sidebarOpen={showSidebar}
          setSidebarOpen={setShowSidebar}
        />
        
        <div className="p-4 sm:p-6">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Company Expenses', href: '/expenses' }
            ]}
          />

          {/* Summary Cards */}
          {summaryData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-semibold text-gray-900">{summaryData.totalExpenses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">{summaryData.pendingExpenses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-semibold text-gray-900">{summaryData.approvedExpenses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1h-2m2 0h2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-semibold text-gray-900">{ExpensesDataService.formatCurrency(summaryData.totalAmount)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {/* Status Filter */}
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    onClick={() => setShowStatusDropdown(showStatusDropdown === 1 ? null : 1)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <span>Status: {statusFilter}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showStatusDropdown === 1 && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {['All', 'Pending', 'Approved', 'Rejected', 'Paid'].map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);
                            setShowStatusDropdown(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category Filter */}
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <span>Category: {categoryFilter}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {['All', 'TRAVEL','SUPPLIES','MAINTENANCE','UTILITIES','SALARY','OTHER'].map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setCategoryFilter(category);
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Department Filter */}
                <div className="relative" ref={departmentDropdownRef}>
                  <button
                    onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <span>Department: {departmentFilter}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showDepartmentDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {['All', ...ExpensesDataService.getDepartmentsList()].map((department) => (
                        <button
                          key={department}
                          onClick={() => {
                            setDepartmentFilter(department);
                            setShowDepartmentDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {department}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Priority Filter */}
                <div className="relative" ref={priorityDropdownRef}>
                  <button
                    onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <span>Priority: {priorityFilter}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showPriorityDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {['All', 'Low', 'Medium', 'High', 'Urgent'].map((priority) => (
                        <button
                          key={priority}
                          onClick={() => {
                            setPriorityFilter(priority);
                            setShowPriorityDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Expense Button */}
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="bg-[#02016a] text-white px-4 py-2 rounded-lg hover:bg-[#03024a] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Expense
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-1">
                        Title
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center gap-1">
                        Amount
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('requestDate')}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
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
                  {pagedItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                          <p className="text-gray-500 mb-4">Get started by adding your first expense.</p>
                          <button
                            onClick={() => setShowAddExpenseModal(true)}
                            className="bg-[#02016a] text-white px-4 py-2 rounded-lg hover:bg-[#03024a] transition-colors"
                          >
                            Add Expense
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ExpensesDataService.formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.requestedBy}</div>
                          <div className="text-sm text-gray-500">{item.requestedByEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ExpensesDataService.getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.requestDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ExpensesDataService.getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {item.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleApproveExpense(item.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleRejectExpense(item.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleViewDetails(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              {pagedItems.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first expense.</p>
                    <button
                      onClick={() => setShowAddExpenseModal(true)}
                      className="bg-[#02016a] text-white px-4 py-2 rounded-lg hover:bg-[#03024a] transition-colors"
                    >
                      Add Expense
                    </button>
                  </div>
                </div>
              ) : (
                pagedItems.map((item) => (
                <div key={item.id} className="p-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ExpensesDataService.getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ExpensesDataService.getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <span className="ml-1 font-medium">{ExpensesDataService.formatCurrency(item.amount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-1">{item.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Requested by:</span>
                      <span className="ml-1">{item.requestedBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Department:</span>
                      <span className="ml-1">{item.department}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {new Date(item.requestDate).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleApproveExpense(item.id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Approve"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRejectExpense(item.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Reject"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleViewDetails(item)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          {/* Pagination (inside card footer) */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Page {safePage} of {totalPages} · Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                <button
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  onClick={() => goToPage(1)}
                  disabled={safePage === 1}
                >
                  First
                </button>
                <button
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage === 1}
                >
                  Prev
                </button>
                <span className="text-sm text-gray-600 px-2">{safePage}</span>
                <button
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage === totalPages}
                >
                  Next
                </button>
                <button
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  onClick={() => goToPage(totalPages)}
                  disabled={safePage === totalPages}
                >
                  Last
                </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <NotificationContainer 
    notifications={notifications} 
    onRemove={removeNotification} 
  />

  {/* Add Expense Modal */}
  <AddExpenseModal
    isOpen={showAddExpenseModal}
    onClose={() => setShowAddExpenseModal(false)}
    onSave={handleAddExpense}
  />

  {/* Expense Details Modal */}
  <ExpenseDetailsModal
    isOpen={showDetailsModal}
    expense={selectedExpense}
    onClose={() => setShowDetailsModal(false)}
    onToggleDecision={handleToggleDecision}
  />
    </div>
  );
}
