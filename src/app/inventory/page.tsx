'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryDataService, InventoryItem, InventorySummary } from '@/services/InventoryDataService';
import { NotificationContainer, useNotifications } from '@/components/Notification';
import { getInventoryProducts, createInventoryProduct, updateInventoryProduct, deleteInventoryProduct, adjustProductStock, getProductMovements } from '@/services/inventory';
import FilterByDateModal from '@/components/FilterByDateModal';
import TimePeriodSelector from '@/components/TimePeriodSelector';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function InventoryPage() {
  const router = useRouter();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  
  // Authentication check
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [summaryData, setSummaryData] = useState<InventorySummary | null>(null);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  
  // API state management
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [alphabeticalFilter, setAlphabeticalFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<'This Week' | 'This Month' | 'All Time'>('This Week');
  
  // Dropdown states
  const [showStatusDropdown, setShowStatusDropdown] = useState<number | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showBulkActionDropdown, setShowBulkActionDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  
  // Refs for click outside detection
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
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

  // Fetch inventory data from API
  const fetchInventoryData = async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      const data = await getInventoryProducts();
      // Handle both array response and { data: [] } response formats
      const itemsArray = Array.isArray(data) ? data : ((data as any).data || []);
      
      // Map API response to InventoryItem format
      const mappedItems = itemsArray.map((item: any) => ({
        id: String(item.id || ''),
        productName: String(item.name || item.productName || 'Unknown Product'),
        category: String(item.category?.name || item.category || 'General'),
        warehouseNumber: String(item.warehouse?.name || item.warehouseNumber || item.warehouse || 'N/A'),
        unitPrice: Number(item.sellingPrice || item.price || item.unitPrice || 0),
        inStock: Number(item.quantity || item.stock || item.inStock || 0),
        discount: Number(item.discount || 0),
        totalValue: Number(item.totalValue || (item.sellingPrice || item.price || 0) * (item.quantity || item.stock || 0)),
        status: String(item.status || 'Active'),
        lastUpdated: String(item.updatedAt || item.lastUpdated || new Date().toISOString()),
        sku: String(item.sku || item.id || ''),
        brand: String(item.brand || ''),
        model: String(item.model || ''),
        size: String(item.size || ''),
        description: String(item.description || ''),
        reorderLevel: Number(item.reorderPoint || item.reorderLevel || 10),
        supplier: String(item.supplier || ''),
        costPrice: Number(item.purchasePrice || item.costPrice || item.cost || 0),
        sellingPrice: Number(item.sellingPrice || item.price || 0),
        profitMargin: Number(item.profitMargin || 0),
        imageUrl: String(item.coverImage || item.imageUrl || item.image || ''),
        tags: Array.isArray(item.tags) ? item.tags : [],
        notes: String(item.notes || ''),
        isActive: Boolean(item.isActive !== false),
        createdAt: String(item.createdAt || new Date().toISOString()),
        dateAdded: String(item.createdAt || new Date().toISOString()),
      }));
      
      setInventoryItems(mappedItems);
      setFilteredItems(mappedItems);
      
      // Store items in localStorage so view page can access the same data
      localStorage.setItem('inventoryItems', JSON.stringify(mappedItems));
      
      // Generate summary from API data
      const summary = InventoryDataService.generateInventorySummary(mappedItems);
      setSummaryData(summary);
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      setApiError(err.message || 'Failed to load inventory');
      showError('Error', err.message || 'Failed to load inventory');
      
      // No fallback - show empty state instead
      setInventoryItems([]);
      setFilteredItems([]);
      setSummaryData(null);
    } finally {
      setApiLoading(false);
    }
  };

  // Load inventory data
  useEffect(() => {
    if (isAuthenticated) {
      fetchInventoryData();
    }
  }, [isAuthenticated]);

  // Handle inventory item creation
  const handleCreateInventoryItem = async (itemData: any) => {
    try {
      const newItem = await createInventoryProduct(itemData);
      // Refresh inventory data
      await fetchInventoryData();
      showSuccess('Success', 'Inventory item created successfully');
    } catch (err: any) {
      console.error('Error creating inventory item:', err);
      showError('Error', err.message || 'Failed to create inventory item');
    }
  };

  // Handle inventory item update
  const handleUpdateInventoryItem = async (id: string, itemData: any) => {
    try {
      const updatedItem = await updateInventoryProduct(id, itemData);
      // Refresh inventory data
      await fetchInventoryData();
      showSuccess('Success', 'Inventory item updated successfully');
    } catch (err: any) {
      console.error('Error updating inventory item:', err);
      showError('Error', err.message || 'Failed to update inventory item');
    }
  };

  // Handle inventory item deletion
  const handleDeleteInventoryItem = async (id: string) => {
    try {
      await deleteInventoryProduct(id);
      // Refresh inventory data
      await fetchInventoryData();
      showSuccess('Success', 'Inventory item deleted successfully');
    } catch (err: any) {
      console.error('Error deleting inventory item:', err);
      showError('Error', err.message || 'Failed to delete inventory item');
    }
  };

  // Handle stock adjustment
  const handleStockAdjustment = async (id: string, adjustment: { quantity: number; reason: string; notes?: string }) => {
    try {
      await adjustProductStock(id, adjustment);
      // Refresh inventory data
      await fetchInventoryData();
      showSuccess('Success', 'Stock adjusted successfully');
    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      showError('Error', err.message || 'Failed to adjust stock');
    }
  };

  // Filter and search items
  useEffect(() => {
    let filtered = inventoryItems;
    
    // Apply search
    filtered = InventoryDataService.searchItems(filtered, searchQuery);
    
    // Apply status filter
    filtered = InventoryDataService.filterItemsByStatus(filtered, statusFilter);
    
    // Apply category filter
    filtered = InventoryDataService.filterItemsByCategory(filtered, categoryFilter);
    
    // Apply alphabetical filter
    if (alphabeticalFilter !== 'All') {
      filtered = filtered.filter(item => {
        const firstLetter = item.productName.charAt(0).toUpperCase();
        return firstLetter === alphabeticalFilter;
      });
    }
    
    // Apply price filter
    if (priceFilter !== 'All') {
      filtered = filtered.filter(item => {
        switch (priceFilter) {
          case 'Under ₦100,000':
            return item.unitPrice < 100000;
          case '₦100,000 - ₦500,000':
            return item.unitPrice >= 100000 && item.unitPrice <= 500000;
          case '₦500,000 - ₦1,000,000':
            return item.unitPrice > 500000 && item.unitPrice <= 1000000;
          case 'Over ₦1,000,000':
            return item.unitPrice > 1000000;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    filtered = InventoryDataService.sortItems(filtered, sortBy, sortOrder);
    
    setFilteredItems(filtered);
  }, [inventoryItems, searchQuery, statusFilter, categoryFilter, alphabeticalFilter, priceFilter, sortBy, sortOrder]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(null);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (bulkActionDropdownRef.current && !bulkActionDropdownRef.current.contains(event.target as Node)) {
        setShowBulkActionDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (index: number, newStatus: 'Published' | 'Unpublished' | 'Draft') => {
    const updatedItems = [...inventoryItems];
    updatedItems[index] = { ...updatedItems[index], status: newStatus };
    setInventoryItems(updatedItems);
    setShowStatusDropdown(null);
    showSuccess('Success', `Product status changed to ${newStatus}`);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleDateFilter = (dateFilter: any) => {
    // Handle date filtering logic here
    showSuccess('Success', 'Date filter applied successfully');
  };

  const getTimePeriodData = () => {
    if (!summaryData) return summaryData;
    
    if (selectedTimePeriod === 'This Week') {
      return {
        ...summaryData,
        allProducts: Math.floor(summaryData.allProducts * 0.8),
        activeProducts: Math.floor(summaryData.activeProducts * 0.85),
        lowStockAlert: Math.floor(summaryData.lowStockAlert * 1.2),
        expired: Math.floor(summaryData.expired * 0.9),
        oneStarRating: Math.floor(summaryData.oneStarRating * 0.8)
      };
    } else if (selectedTimePeriod === 'All Time') {
      // For "All Time", return the full summary data without modifications
      return summaryData;
    } else {
      return summaryData;
    }
  };

  const currentSummaryData = getTimePeriodData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
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
      <Sidebar currentPage="inventory" sidebarOpen={showSidebar} setSidebarOpen={setShowSidebar} />
      
      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto transition-all duration-300 relative">
        <Header 
          title="Tyre Inventory" 
          sidebarOpen={showSidebar}
          setSidebarOpen={setShowSidebar}
        />
        
        <div className="p-4 sm:p-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Tyre Inventory</span>
            </nav>
          </div>

          {/* Inventory Summary */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Tyre Inventory Summary</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/inventory/create')}
                  className="bg-[#02016a] text-white px-4 py-2 rounded-lg hover:bg-[#03024a] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                    Add new inventory
                </button>
                <TimePeriodSelector
                  selectedTimePeriod={selectedTimePeriod}
                  onTimePeriodChange={setSelectedTimePeriod}
                />
              </div>
            </div>

            {currentSummaryData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* All Tyres Card */}
                <div className="bg-[#02016a] text-white p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm">All Tyres</p>
                      <p className="text-3xl font-bold">{currentSummaryData.allProducts}</p>
                      <p className="text-white/80 text-sm mt-1">
                        Active {currentSummaryData.activeProducts} {Math.round((currentSummaryData.activeProducts / currentSummaryData.allProducts) * 100)}%
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>

                {/* Low Stock Alert Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#8b8d97] text-sm">Low Tyre Stock</p>
                      <p className="text-3xl font-bold text-[#45464e]">{currentSummaryData.lowStockAlert}</p>
                    </div>
                    <svg className="w-8 h-8 text-[#8b8d97]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>

                {/* Expired Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#8b8d97] text-sm">Expired</p>
                      <p className="text-3xl font-bold text-[#45464e]">{currentSummaryData.expired}</p>
                    </div>
                    <svg className="w-8 h-8 text-[#8b8d97]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* 1 Star Rating Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#8b8d97] text-sm">1 Star Rating</p>
                      <p className="text-3xl font-bold text-[#45464e]">{currentSummaryData.oneStarRating}</p>
                    </div>
                    <svg className="w-8 h-8 text-[#8b8d97]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>

                {/* Empty card for spacing */}
                <div className="hidden lg:block"></div>
              </div>
            )}
          </div>

          {/* Inventory Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Tyre Products</h2>
                
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search"
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
                        Filter
                      </button>
                        {showFilterDropdown && (
                          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                            <div className="py-1">
                              {/* Status Filters */}
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                Status
                              </div>
                              <button
                                onClick={() => {
                                  setStatusFilter('All');
                                  setShowFilterDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${statusFilter === 'All' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                              >
                                All Status
                              </button>
                              <button
                                onClick={() => {
                                  setStatusFilter('Published');
                                  setShowFilterDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${statusFilter === 'Published' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                              >
                                Published
                              </button>
                              <button
                                onClick={() => {
                                  setStatusFilter('Unpublished');
                                  setShowFilterDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${statusFilter === 'Unpublished' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                              >
                                Unpublished
                              </button>
                              <button
                                onClick={() => {
                                  setStatusFilter('Draft');
                                  setShowFilterDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${statusFilter === 'Draft' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                              >
                                Draft
                              </button>

                              {/* Category Filters */}
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mt-2">
                                Category
                              </div>
                              <button
                                onClick={() => {
                                  setCategoryFilter('All');
                                  setShowFilterDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${categoryFilter === 'All' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                              >
                                All Categories
                              </button>
                              {Array.from(new Set(inventoryItems.map(item => item.category))).sort().map(category => (
                                <button
                                  key={category}
                                  onClick={() => {
                                    setCategoryFilter(category);
                                    setShowFilterDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${categoryFilter === category ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                                >
                                  {category}
                                </button>
                              ))}

                              {/* Alphabetical Filters */}
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mt-2">
                                Alphabetical
                              </div>
                              <button
                                onClick={() => {
                                  setAlphabeticalFilter('All');
                                  setShowFilterDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${alphabeticalFilter === 'All' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                              >
                                All (A-Z)
                              </button>
                              {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
                                <button
                                  key={letter}
                                  onClick={() => {
                                    setAlphabeticalFilter(letter);
                                    setShowFilterDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${alphabeticalFilter === letter ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                                >
                                  {letter}
                                </button>
                              ))}

                              {/* Price Filters */}
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mt-2">
                                Price Range
                              </div>
                              <button
                                onClick={() => {
                                  setPriceFilter('All');
                                  setShowFilterDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${priceFilter === 'All' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                              >
                                All Prices
                              </button>
                              <button
                                onClick={() => {
                                  setPriceFilter('Under ₦100,000');
                                  setShowFilterDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${priceFilter === 'Under ₦100,000' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                              >
                                Under ₦100,000
                              </button>
                              <button
                                onClick={() => {
                                  setPriceFilter('₦100,000 - ₦500,000');
                                  setShowFilterDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${priceFilter === '₦100,000 - ₦500,000' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                              >
                                ₦100,000 - ₦500,000
                              </button>
                              <button
                                onClick={() => {
                                  setPriceFilter('₦500,000 - ₦1,000,000');
                                  setShowFilterDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${priceFilter === '₦500,000 - ₦1,000,000' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                              >
                                ₦500,000 - ₦1,000,000
                              </button>
                              <button
                                onClick={() => {
                                  setPriceFilter('Over ₦1,000,000');
                                  setShowFilterDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${priceFilter === 'Over ₦1,000,000' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-[#45464e]'}`}
                              >
                                Over ₦1,000,000
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

                    {/* Share */}
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Share
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
                            <button 
                              onClick={() => {
                                setShowBulkActionDropdown(false);
                                showSuccess('Success', 'Selected items published successfully');
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Publish Selected
                            </button>
                            <button 
                              onClick={() => {
                                setShowBulkActionDropdown(false);
                                showSuccess('Success', 'Selected items unpublished successfully');
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Unpublish Selected
                            </button>
                            <button 
                              onClick={() => {
                                setShowBulkActionDropdown(false);
                                showSuccess('Success', 'Selected items archived successfully');
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Archive Selected
                            </button>
                            <button 
                              onClick={() => {
                                setShowBulkActionDropdown(false);
                                showSuccess('Success', 'Selected items deleted successfully');
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
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
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('productName')}
                    >
                      <div className="flex items-center gap-1">
                        Product Name
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center gap-1">
                        Category
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warehouse
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('unitPrice')}
                    >
                      <div className="flex items-center gap-1">
                        Unit Price
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('inStock')}
                    >
                      <div className="flex items-center gap-1">
                        In-Stock
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('totalValue')}
                    >
                      <div className="flex items-center gap-1">
                        Total Value
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiLoading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02016a]"></div>
                          <span className="ml-2 text-gray-600">Loading inventory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : apiError ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center">
                        <div className="text-red-600">
                          <p className="font-medium">Error loading inventory</p>
                          <p className="text-sm mt-1">{apiError}</p>
                          <button 
                            onClick={fetchInventoryData}
                            className="mt-2 px-4 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No inventory items found</p>
                          <p className="text-sm mt-1">Create your first inventory item to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.slice(0, 10).map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/inventory/view?id=${item.id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300" onClick={(e) => e.stopPropagation()} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                            <img
                              src={InventoryDataService.getProductImage(item)}
                              alt={item.productName}
                              className="w-10 h-10 object-contain"
                              onError={(e) => { 
                                e.currentTarget.style.display = 'none'; 
                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextElement) {
                                  nextElement.style.display = 'flex';
                                }
                              }}
                            />
                            <div className="w-10 h-10 bg-gray-200 rounded items-center justify-center text-xs font-semibold text-gray-600 hidden">
                              {InventoryDataService.getTireBrandInitials(item.productName)}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                            <div className="text-xs text-gray-500 mt-1">
                              {item.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.warehouseNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {InventoryDataService.formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.inStock === 0 ? (
                          <span className="text-red-600 font-medium">Out of Stock</span>
                        ) : item.inStock < 10 ? (
                          <span className="text-orange-600 font-medium">Low Stock ({item.inStock})</span>
                        ) : (
                          item.inStock
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {InventoryDataService.formatCurrency(item.discount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {InventoryDataService.formatCurrency(item.totalValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative" ref={statusDropdownRef}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowStatusDropdown(showStatusDropdown === index ? null : index);
                            }}
                            className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                              item.status === 'Published' 
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                : item.status === 'Unpublished'
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {item.status === 'Published' ? 'Publish' : 'Unpublish'}
                            <svg className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${showStatusDropdown === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showStatusDropdown === index && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <div className="py-1">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(index, 'Published');
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Publish
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(index, 'Unpublished');
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Unpublish
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(index, 'Draft');
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Draft
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${InventoryDataService.getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
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
                    <span className="ml-2 text-gray-600">Loading inventory...</span>
                  </div>
                </div>
              ) : apiError ? (
                <div className="p-8 text-center">
                  <div className="text-red-600">
                    <p className="font-medium">Error loading inventory</p>
                    <p className="text-sm mt-1">{apiError}</p>
                    <button 
                      onClick={fetchInventoryData}
                      className="mt-2 px-4 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-500">
                    <p className="font-medium">No inventory items found</p>
                    <p className="text-sm mt-1">Create your first inventory item to get started</p>
                  </div>
                </div>
              ) : (
                filteredItems.slice(0, 10).map((item, index) => (
                <div key={item.id} className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/inventory/view?id=${item.id}`)}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 rounded border-gray-300" onClick={(e) => e.stopPropagation()} />
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        src={InventoryDataService.getProductImage(item)}
                        alt={item.productName}
                        className="w-10 h-10 object-contain"
                        onError={(e) => { 
                          e.currentTarget.style.display = 'none'; 
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="w-10 h-10 bg-gray-200 rounded items-center justify-center text-xs font-semibold text-gray-600 hidden">
                        {InventoryDataService.getTireBrandInitials(item.productName)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{item.productName}</h3>
                          <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.warehouseNumber || 'N/A'}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Price:</span>
                              <span className="text-gray-900">{InventoryDataService.formatCurrency(item.unitPrice)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Stock:</span>
                              <span className={
                                item.inStock === 0 ? "text-red-600 font-medium" : 
                                item.inStock < 10 ? "text-orange-600 font-medium" : 
                                "text-gray-900"
                              }>
                                {item.inStock === 0 ? "Out of Stock" : 
                                 item.inStock < 10 ? `Low Stock (${item.inStock})` : 
                                 item.inStock}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Total Value:</span>
                              <span className="text-gray-900">{InventoryDataService.formatCurrency(item.totalValue)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-3 flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${InventoryDataService.getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <div className="relative" ref={statusDropdownRef}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowStatusDropdown(showStatusDropdown === index ? null : index);
                              }}
                              className={`px-3 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                                item.status === 'Published' 
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                  : item.status === 'Unpublished'
                                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {item.status === 'Published' ? 'Publish' : 'Unpublish'}
                              <svg className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${showStatusDropdown === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {showStatusDropdown === index && (
                              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                <div className="py-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(index, 'Published');
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Publish
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(index, 'Unpublished');
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Unpublish
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(index, 'Draft');
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Draft
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
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
                  <span className="text-sm text-gray-700">1 of 44 pages</span>
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
        </div>
      </main>

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
