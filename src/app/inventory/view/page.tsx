'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { InventoryDataService, InventoryItem, Purchase } from '@/services/InventoryDataService';
import { getProduct, updateProduct } from '@/services/products';
import { NotificationContainer, useNotifications } from '@/components/Notification';
import FilterByDateModal from '@/components/FilterByDateModal';
import EditProductModal from '@/components/EditProductModal';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

function ViewInventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  
  // Authentication check
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Data states
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showBulkActionDropdown, setShowBulkActionDropdown] = useState(false);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Refs for click outside detection
  const filterDropdownRef = useRef<HTMLDivElement>(null);
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

  // Load inventory item data from API only once when the component mounts or ID changes
  useEffect(() => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) return;
    
    // Get product ID from URL
    const itemId = searchParams.get('id');
    if (!itemId) {
      showError('Error', 'No product ID provided');
      return;
    }
    
    // Track if component is mounted
    let mounted = true;
    
    async function fetchProductDetails() {
      try {
        if (!itemId) {
          showError('Error', 'No product ID provided');
          return;
        }
        const p = await getProduct(itemId);
        
        // Don't update state if component unmounted
        if (!mounted) return;
        
        if (!p || !p.id) {
          setInventoryItem(null);
          showError('Error', 'Product not found');
          return;
        }
        
        // Map API response to UI model
        const item: InventoryItem = {
          id: p.id,
          productName: p.name || 'Product',
          category: p.category?.name || p.category || 'General',
          unitPrice: p.sellingPrice ?? p.price ?? 0,
          inStock: p.quantity ?? p.stock ?? 0,
          discount: 0,
          totalValue: (p.quantity ?? 0) * (p.sellingPrice ?? p.price ?? 0),
          status: 'Published',
          description: p.description || '',
          dateAdded: p.createdAt || new Date().toISOString(),
          // Required fields for InventoryItem
          costPrice: p.purchasePrice ?? p.costPrice ?? 0,
          image: '',
          views: p.views || 0,
          favorites: p.favorites || 0,
          lastOrder: p.lastOrderDate || undefined,
        } as any;
        
        setInventoryItem(item);
        
        // For now, we'll continue using mock purchase data
        // In a real implementation, you'd fetch real purchase data from the API
        const samplePurchases = InventoryDataService.generatePurchases(itemId, 20);
        setPurchases(samplePurchases);
        setFilteredPurchases(samplePurchases);
        
      } catch (error) {
        if (mounted) {
          setInventoryItem(null);
          setPurchases([]);
          setFilteredPurchases([]);
          showError('Error', 'Failed to load product');
        }
      }
    }
    
    fetchProductDetails();
    
    // Cleanup function to prevent state updates after unmount
    return () => { mounted = false; };
  }, [isAuthenticated, searchParams, showError]); // Only re-run if authentication state or product ID changes

  // Filter purchases
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPurchases(purchases);
      return;
    }
    
    const filtered = purchases.filter(purchase => 
      purchase.orderDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.orderType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPurchases(filtered);
  }, [searchQuery, purchases]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
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

  const handleEditProduct = () => {
    setShowEditModal(true);
  };

  const handleSaveProduct = async (formData: any, mainImage: string | null, additionalImages: string[]) => {
    if (inventoryItem) {
      try {
        // Prepare the API payload
        const updatePayload = {
          name: formData.productName,
          category: formData.category,
          sellingPrice: parseFloat(formData.sellingPrice) || inventoryItem.unitPrice,
          purchasePrice: parseFloat(formData.costPrice) || inventoryItem.costPrice,
          quantity: parseInt(formData.quantityInStock) || inventoryItem.inStock,
          description: formData.shortDescription,
          // Add any other fields your API expects
        };
        
        // Call API to update the product
        await updateProduct(inventoryItem.id, updatePayload);
        
        // Update local state with form data
        const updatedItem = {
          ...inventoryItem,
          productName: formData.productName,
          category: formData.category,
          unitPrice: parseFloat(formData.sellingPrice) || inventoryItem.unitPrice,
          costPrice: parseFloat(formData.costPrice) || inventoryItem.costPrice,
          inStock: parseInt(formData.quantityInStock) || inventoryItem.inStock,
          description: formData.shortDescription,
          // We keep these UI-specific fields
          image: mainImage || inventoryItem.image,
          additionalImages: additionalImages.length > 0 ? additionalImages : inventoryItem.additionalImages
        };
        
        setInventoryItem(updatedItem);
        showSuccess('Success', 'Product updated successfully');
      } catch (error) {
        showError('Error', 'Failed to update product');
      }
    }
  };

  const handleUnpublishProduct = async () => {
    if (inventoryItem) {
      try {
        // Optimistically update UI first for better UX
        const updatedItem = { ...inventoryItem, status: 'Unpublished' as const };
        setInventoryItem(updatedItem);
        
        // Call API to update product status
        const updatePayload = {
          status: 'INACTIVE' // Assuming the backend expects INACTIVE for unpublished
        };
        
        await updateProduct(inventoryItem.id, updatePayload);
        showSuccess('Success', 'Product unpublished successfully');
      } catch (error) {
        // Revert optimistic update on error
        setInventoryItem(inventoryItem);
        showError('Error', 'Failed to unpublish product');
      }
    }
  };

  const handlePublishProduct = async () => {
    if (inventoryItem) {
      try {
        // Optimistically update UI first for better UX
        const updatedItem = { ...inventoryItem, status: 'Published' as const };
        setInventoryItem(updatedItem);
        
        // Call API to update product status
        const updatePayload = {
          status: 'ACTIVE' // Assuming the backend expects ACTIVE for published
        };
        
        await updateProduct(inventoryItem.id, updatePayload);
        showSuccess('Success', 'Product published successfully');
      } catch (error) {
        // Revert optimistic update on error
        setInventoryItem(inventoryItem);
        showError('Error', 'Failed to publish product');
      }
    }
  };

  const handleDateFilter = (dateFilter: any) => {
    // Handle date filtering logic here
    console.log('Date filter applied:', dateFilter);
    showSuccess('Success', 'Date filter applied successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory item...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !inventoryItem) {
    return null;
  }

  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar currentPage="inventory" sidebarOpen={showSidebar} setSidebarOpen={setShowSidebar} />
      
      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto transition-all duration-300 relative">
        <Header 
          title="View Tyre Product" 
          sidebarOpen={showSidebar}
          setSidebarOpen={setShowSidebar}
        />
        
        <div className="p-4 sm:p-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Inventory</span>
              <span>/</span>
              <span>View Inventory</span>
            </nav>
          </div>

          {/* Product Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{inventoryItem.productName}</h1>
                <p className="text-gray-600">Date Added {new Date(inventoryItem.dateAdded).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-gray-600">Product URL</span>
                  <span className="text-blue-600">1nancystores.com/{inventoryItem.productName.toLowerCase().replace(/\s+/g, '-')}</span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <div className="relative">
                  <button
                    onClick={handleEditProduct}
                    className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
                  >
                    Edit Product
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {inventoryItem.status === 'Published' ? (
                  <button
                    onClick={handleUnpublishProduct}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Unpublish Product
                  </button>
                ) : (
                  <button
                    onClick={handlePublishProduct}
                    className="bg-[#02016a] text-white px-6 py-3 rounded-lg hover:bg-[#03024a] transition-colors"
                  >
                    Publish Product
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Overview */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Product Image */}
              <div className="lg:w-1/3">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={InventoryDataService.getProductImage(inventoryItem)}
                    alt={inventoryItem.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-full bg-gray-200 items-center justify-center hidden">
                    <span className="text-4xl font-bold text-gray-600">
                      {InventoryDataService.getTireBrandInitials(inventoryItem.productName)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="lg:w-2/3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Order</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {inventoryItem.lastOrder 
                        ? new Date(inventoryItem.lastOrder).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric'
                          })
                        : 'No orders yet'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Price</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {InventoryDataService.formatCurrency(inventoryItem.unitPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">In-Stock</p>
                    <p className="text-lg font-semibold text-gray-900">{inventoryItem.inStock}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${InventoryDataService.getStatusColor(inventoryItem.status)}`}>
                      {inventoryItem.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {/* Total Orders */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {InventoryDataService.formatCurrency(purchases.reduce((sum, p) => sum + p.orderTotal, 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Views */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">Views</p>
                  <p className="text-lg font-semibold text-gray-900">{inventoryItem.views.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Favourite */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">Favourite</p>
                  <p className="text-lg font-semibold text-gray-900">{inventoryItem.favorites}</p>
                </div>
              </div>
            </div>

            {/* All Orders */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">All Orders</p>
                  <p className="text-lg font-semibold text-gray-900">{purchases.length}</p>
                </div>
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-lg font-semibold text-gray-900">
                  {purchases.filter(p => p.status === 'Pending').length}
                </p>
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {purchases.filter(p => p.status === 'Completed').length}
                </p>
              </div>
            </div>

            {/* Canceled */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div>
                <p className="text-sm text-gray-600">Canceled</p>
                <p className="text-lg font-semibold text-gray-900">
                  {purchases.filter(p => p.status === 'Cancelled').length}
                </p>
              </div>
            </div>

            {/* Returned */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div>
                <p className="text-sm text-gray-600">Returned</p>
                <p className="text-lg font-semibold text-gray-900">
                  {purchases.filter(p => p.status === 'Returned').length}
                </p>
              </div>
            </div>

            {/* Damaged */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div>
                <p className="text-sm text-gray-600">Damaged</p>
                <p className="text-lg font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          {/* Purchases Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Purchases</h2>
                
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
                    {/* Filter */}
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
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              All Status
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Completed
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Pending
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Cancelled
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Returned
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
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Export Selected
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Mark as Completed
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              Cancel Selected
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
                      <div className="flex items-center gap-1">
                        Order Date
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Order Type
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Unit Price
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Qty
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Discount
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Order Total
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPurchases.slice(0, 10).map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(purchase.orderDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.orderType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {InventoryDataService.formatCurrency(purchase.unitPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {InventoryDataService.formatCurrency(purchase.discount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {InventoryDataService.formatCurrency(purchase.orderTotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${InventoryDataService.getStatusColor(purchase.status)}`}>
                          {purchase.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              {filteredPurchases.slice(0, 10).map((purchase) => (
                <div key={purchase.id} className="p-4 border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 rounded border-gray-300" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(purchase.orderDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{purchase.orderType}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Unit Price:</span>
                              <span className="text-gray-900">{InventoryDataService.formatCurrency(purchase.unitPrice)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Qty:</span>
                              <span className="text-gray-900">{purchase.quantity}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Total:</span>
                              <span className="text-gray-900">{InventoryDataService.formatCurrency(purchase.orderTotal)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-3">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${InventoryDataService.getStatusColor(purchase.status)}`}>
                            {purchase.status}
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
                    1-10 of {filteredPurchases.length} items
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">1 of {Math.ceil(filteredPurchases.length / 10)} pages</span>
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

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProduct}
        inventoryItem={inventoryItem}
      />
    </div>
  );
}

export default function ViewInventoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ViewInventoryContent />
    </Suspense>
  );
}
