'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { InventoryDataService, InventoryItem, Purchase } from '@/services/InventoryDataService';
import {
  getInventoryProductById,
  updateInventoryProduct,
  getProductPurchaseHistory,
  type InventoryStatus,
  type SaleItem,
} from '@/services/inventory';
import { getWarehouse } from '@/services/warehouses';
import { NotificationContainer, useNotifications } from '@/components/Notification';
import FilterByDateModal from '@/components/FilterByDateModal';
import EditProductModal from '@/components/EditProductModal';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';

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
  const [warehouseInfo, setWarehouseInfo] = useState<{ id: string; name: string } | null>(null);
  const [productDetails, setProductDetails] = useState<any>(null); // Store full product data
  const [productId, setProductId] = useState<string | null>(null);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showBulkActionDropdown, setShowBulkActionDropdown] = useState(false);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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

  // Extract product ID once - must run before other effects
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setProductId(id);
    }
  }, []);

  // Load inventory item data
  useEffect(() => {
    // Don't fetch if not authenticated or no product ID
    if (!isAuthenticated || !productId) return;
    
    // Track if component is mounted
    let mounted = true;
    
    async function fetchProductDetails() {
      try {
        const product = await getInventoryProductById(productId as string);

        if (!mounted) return;
        
        if (!product || !product.id) {
          setInventoryItem(null);
          showError('Error', 'Product not found');
          return;
        }
        
        // Store full product details for display
        setProductDetails(product);
        
        const piecesInStock =
          product.inventoryUnits?.piecesInStock ?? product.quantity ?? 0;

        const item: InventoryItem = {
          id: product.id,
          productName: product.name || 'Product',
          category: product.category ?? product.categoryName ?? 'General',
          unitPrice: product.sellingPrice ?? 0,
          inStock: piecesInStock,
          discount: 0,
          totalValue: piecesInStock * (product.sellingPrice ?? 0),
          status: 'Published',
          description: product.description || '',
          dateAdded: product.createdAt || new Date().toISOString(),
          costPrice: product.purchasePrice ?? 0,
          image: '',
          views: 0,
          favorites: 0,
          lastOrder: product.updatedAt || undefined,
          warehouseNumber: product.warehouse ?? 'N/A',
          brand: '',
          longDescription: product.description || '',
          additionalImages: [],
        } as InventoryItem;
        
        setInventoryItem(item);
        
        if (product.warehouseId) {
          try {
            const warehouse = await getWarehouse(product.warehouseId);
            setWarehouseInfo({ id: warehouse.id, name: warehouse.name });
          } catch (error) {
            console.error('Failed to fetch warehouse info:', error);
            setWarehouseInfo({ 
              id: product.warehouseId,
              name: product.warehouse ?? 'Unknown Warehouse',
            });
          }
        }
      } catch (error: any) {
        if (mounted) {
          setInventoryItem(null);
          showError('Error', error.message || 'Failed to load product details');
        }
      }
    }
    
    fetchProductDetails();
    
    // Cleanup function to prevent state updates after unmount
    return () => { mounted = false; };
  }, [isAuthenticated, productId]);

  // Fallback: Load from localStorage if API fails
  useEffect(() => {
    if (isAuthenticated && !inventoryItem && productId) {
      // Try to load the actual item from localStorage first
      const storedItems = localStorage.getItem('inventoryItems');
      let item: InventoryItem | null = null;
      
      if (storedItems) {
        try {
          const items: InventoryItem[] = JSON.parse(storedItems);
          item = items.find(i => i.id === productId) || null;
        } catch (error) {
          console.error('Error parsing stored inventory items:', error);
        }
      }
      
      // If not found in localStorage, generate a new one (fallback)
      if (!item) {
        item = InventoryDataService.generateInventoryItem(productId);
      }
      
      setInventoryItem(item);
      
      // Set warehouse info from the item if available
      if (item.warehouseNumber && item.warehouseNumber !== 'N/A') {
        setWarehouseInfo({ 
          id: item.warehouseNumber, 
          name: item.warehouseNumber 
        });
      }
    }
  }, [isAuthenticated, productId]); // Only depend on the ID, not the entire searchParams object or inventoryItem

  // Fetch purchases once when component mounts or productId changes
  useEffect(() => {
    if (!isAuthenticated || !productId) return;
    
    let mounted = true;
    
    async function fetchPurchases() {
      try {
        const purchaseHistory = await getProductPurchaseHistory(productId as string, 20);
        
        if (!mounted) return;
        
        const responseData = purchaseHistory as any;
        const items = responseData?.data;
        
        if (!Array.isArray(items) || items.length === 0) {
          setPurchases([]);
          setFilteredPurchases([]);
          return;
        }
        
        // Group items by saleId to create purchase objects
        const purchaseMap = new Map<string, Purchase>();
        
        items.forEach((item: any) => {
          const saleId = item.saleId;
          if (!saleId) return;
          
          if (!purchaseMap.has(saleId)) {
            const sale = item.sale || {};
            const customer = sale.customer || {};
            
            purchaseMap.set(saleId, {
              id: saleId,
              date: sale.createdAt || item.createdAt || new Date().toISOString(),
              price: item.unitPrice || 0,
              quantity: 0,
              totalAmount: sale.totalAmount || 0,
              status: sale.status || 'PENDING',
              orderType: sale.orderType || 'Standard',
              customerName: customer.name || 'Unknown Customer',
              customerPhone: customer.phone || '',
              saleReference: sale.saleReference || sale.id?.substring(0, 8) || '',
              items: [],
            });
          }
          
          const purchase = purchaseMap.get(saleId)!;
          purchase.items = purchase.items || [];
          purchase.items.push({
            id: item.id,
            productId: item.productId,
            productName: item.productName || responseData.productName || 'Product',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            status: item.status || purchase.status || 'PENDING',
            unitType: item.selectedUnit,
          });
          purchase.quantity += item.quantity;
        });
        
        const purchases = Array.from(purchaseMap.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setPurchases(purchases);
        setFilteredPurchases(purchases);
        setCurrentPage(1);
      } catch (error) {
        console.error('Failed to fetch purchase history:', error);
        setPurchases([]);
        setFilteredPurchases([]);
      }
    }
    
    fetchPurchases();
    return () => { mounted = false; };
  }, [isAuthenticated, productId]);

  // Apply search and status filter to already fetched purchases
  useEffect(() => {
    let filtered = purchases;
    
    // Only apply search filter - always show all items
    if (searchQuery.trim()) {
      filtered = filtered.filter(purchase => 
        purchase.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.orderType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.saleReference.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredPurchases(filtered);
    setCurrentPage(1);
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

  // Calculate item-level statistics for summary cards
  const getItemStatistics = () => {
    const stats = {
      total: 0,
      pending: 0,
      completed: 0,
      returned: 0,
      damaged: 0,
      canceled: 0,
      totalValue: 0,
    };

    purchases.forEach(purchase => {
      if (purchase.items && Array.isArray(purchase.items)) {
        purchase.items.forEach(item => {
          stats.total++;
          stats.totalValue += item.totalPrice || 0;
          
          switch(item.status?.toUpperCase()) {
            case 'PENDING':
              stats.pending++;
              break;
            case 'COMPLETED':
              stats.completed++;
              break;
            case 'RETURNED':
              stats.returned++;
              break;
            case 'DAMAGED':
              stats.damaged++;
              break;
            case 'CANCELED':
              stats.canceled++;
              break;
          }
        });
      }
    });

    return stats;
  };

  const itemStats = getItemStatistics();

  const handleUpdateItemStatus = async (saleId: string, itemId: string, newStatus: string) => {
    try {
      const response = await fetch(
        `/api/ceeone/sales/${saleId}/items/${itemId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update item status');
      }

      showSuccess('Success', `Item status updated to ${newStatus}`);
      
      // Refresh purchases data - don't filter, get all items
      if (productId) {
        const purchaseHistory = await getProductPurchaseHistory(productId as string, 20);
        
        if (purchaseHistory) {
          // Handle both response formats
          const items = (purchaseHistory as any).data || (purchaseHistory as any).purchases || [];
          
          if (Array.isArray(items)) {
            // Group items by saleId
            const purchaseMap = new Map<string, Purchase>();
            
            items.forEach((item: any) => {
              const saleId = item.saleId;
              if (!saleId) return;
              
              if (!purchaseMap.has(saleId)) {
                const sale = item.sale || {};
                const customer = sale.customer || {};
                
                purchaseMap.set(saleId, {
                  id: saleId,
                  date: sale.createdAt || item.createdAt || new Date().toISOString(),
                  price: item.unitPrice || 0,
                  quantity: 0,
                  totalAmount: sale.totalAmount || 0,
                  status: sale.status || 'PENDING',
                  orderType: sale.orderType || 'Standard',
                  customerName: customer.name || 'Unknown Customer',
                  customerPhone: customer.phone || '',
                  saleReference: sale.saleReference || sale.id?.substring(0, 8) || '',
                  items: [],
                });
              }
              
              const purchase = purchaseMap.get(saleId)!;
              purchase.items = purchase.items || [];
              purchase.items.push({
                id: item.id,
                productId: item.productId,
                productName: item.productName || (purchaseHistory as any).productName || 'Product',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                status: item.status || purchase.status || 'PENDING',
                unitType: item.selectedUnit,
              });
              purchase.quantity += item.quantity;
            });
            
            const formattedPurchases = Array.from(purchaseMap.values()).sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            
            setPurchases(formattedPurchases);
            setFilteredPurchases(formattedPurchases);
          }
        }
      }
    } catch (error: any) {
      console.error('Error updating item status:', error);
      showError('Error', error.message || 'Failed to update item status');
    }
  };

  const handleEditProduct = () => {
    setShowEditModal(true);
  };

  const handleSaveProduct = async (formData: any, mainImage: string | null, additionalImages: string[]) => {
    if (inventoryItem) {
      try {
        const normalizedStatus: InventoryStatus =
          inventoryItem.status === 'Published'
            ? 'PUBLISHED'
            : inventoryItem.status === 'Draft'
            ? 'DRAFT'
            : 'UNPUBLISHED';

        const updatePayload = {
          name: formData.productName,
          sellingPrice: parseFloat(formData.sellingPrice) || inventoryItem.unitPrice,
          purchasePrice: parseFloat(formData.costPrice) || inventoryItem.costPrice,
          inventoryUnits: {
            piecesInStock: parseInt(formData.quantityInStock) || inventoryItem.inStock,
          },
          description: formData.shortDescription,
          status: normalizedStatus,
        };

        await updateInventoryProduct(inventoryItem.id, updatePayload);

        // Update the local state with new data
        const updatedItem = {
          ...inventoryItem,
          productName: formData.productName,
          category: formData.category,
          unitPrice: parseFloat(formData.sellingPrice) || inventoryItem.unitPrice,
          costPrice: parseFloat(formData.costPrice) || inventoryItem.costPrice,
          inStock: parseInt(formData.quantityInStock) || inventoryItem.inStock,
          brand: formData.productBrand,
          description: formData.shortDescription,
          longDescription: formData.longDescription,
          image: mainImage || inventoryItem.image,
          additionalImages: additionalImages.length > 0 ? additionalImages : inventoryItem.additionalImages,
          warehouseNumber: formData.warehouseNumber || inventoryItem.warehouseNumber
        };
        
        setInventoryItem(updatedItem);
      
        // Update localStorage with the updated item
        const storedItems = localStorage.getItem('inventoryItems');
        if (storedItems) {
          try {
            const items: InventoryItem[] = JSON.parse(storedItems);
            const updatedItems = items.map(item => 
              item.id === updatedItem.id ? updatedItem : item
            );
            localStorage.setItem('inventoryItems', JSON.stringify(updatedItems));
          } catch (error) {
            console.error('Error updating stored inventory items:', error);
          }
        }
        
        showSuccess('Success', 'Product updated successfully');
      } catch (error: any) {
        console.error('Error updating product:', error);
        showError('Error', error.message || 'Failed to update product');
      }
    }
  };

  const handleUnpublishProduct = async () => {
    if (inventoryItem) {
      try {
        // Update product status via API
        const updatePayload = {
          status: 'UNPUBLISHED' as InventoryStatus,
        };

        const updatedProduct = await updateInventoryProduct(inventoryItem.id, updatePayload);

        // Update local state with API response
        const updatedItem = {
          ...inventoryItem,
          status: 'Unpublished' as const,
        };
        setInventoryItem(updatedItem);
        
      // Update localStorage
      const storedItems = localStorage.getItem('inventoryItems');
      if (storedItems) {
        try {
          const items: InventoryItem[] = JSON.parse(storedItems);
          const updatedItems = items.map(item => 
            item.id === updatedItem.id ? updatedItem : item
          );
          localStorage.setItem('inventoryItems', JSON.stringify(updatedItems));
      } catch (error) {
          console.error('Error updating stored inventory items:', error);
      }
      }
      
      showSuccess('Success', 'Product unpublished successfully');
      } catch (error: any) {
        console.error('Error unpublishing product:', error);
        showError('Error', error.message || 'Failed to unpublish product');
      }
    }
  };

  const handlePublishProduct = async () => {
    if (inventoryItem) {
      try {
        // Update product status via API
        const updatePayload = {
          status: 'PUBLISHED' as InventoryStatus,
        };

        const updatedProduct = await updateInventoryProduct(inventoryItem.id, updatePayload);

        // Update local state with API response
        const updatedItem = {
          ...inventoryItem,
          status: 'Published' as const,
        };
        setInventoryItem(updatedItem);
        
      // Update localStorage
      const storedItems = localStorage.getItem('inventoryItems');
      if (storedItems) {
        try {
          const items: InventoryItem[] = JSON.parse(storedItems);
          const updatedItems = items.map(item => 
            item.id === updatedItem.id ? updatedItem : item
          );
          localStorage.setItem('inventoryItems', JSON.stringify(updatedItems));
      } catch (error) {
          console.error('Error updating stored inventory items:', error);
      }
      }
      
      showSuccess('Success', 'Product published successfully');
      } catch (error: any) {
        console.error('Error publishing product:', error);
        showError('Error', error.message || 'Failed to publish product');
      }
    }
  };

  const handleDateFilter = (dateFilter: any) => {
    // Handle date filtering logic here
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
          title="View Product" 
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
                        : purchases.length > 0 
                          ? new Date(purchases[0].date).toLocaleDateString('en-US', { 
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
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Warehouse</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {warehouseInfo?.name || inventoryItem.warehouseNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Details Section */}
          {productDetails && (productDetails.pricePerRoll || productDetails.pricePerDozen || productDetails.pricePerCarton || productDetails.pricePerPiece) && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {productDetails.pricePerPiece && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Price per Piece</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {InventoryDataService.formatCurrency(productDetails.pricePerPiece)}
                    </p>
                  </div>
                )}
                {productDetails.pricePerCarton && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Price per Carton</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {InventoryDataService.formatCurrency(productDetails.pricePerCarton)}
                    </p>
                    {productDetails.piecesPerCarton && (
                      <p className="text-xs text-gray-500 mt-1">
                        ({productDetails.piecesPerCarton} pieces)
                      </p>
                    )}
                  </div>
                )}
                {productDetails.pricePerRoll && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Price per Roll</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {InventoryDataService.formatCurrency(productDetails.pricePerRoll)}
                    </p>
                    {productDetails.piecesPerRoll && (
                      <p className="text-xs text-gray-500 mt-1">
                        ({productDetails.piecesPerRoll} pieces)
                      </p>
                    )}
                  </div>
                )}
                {productDetails.pricePerDozen && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                    <p className="text-sm text-gray-600 mb-1">Price per Dozen</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {InventoryDataService.formatCurrency(productDetails.pricePerDozen)}
                    </p>
                    {productDetails.piecesPerDozen && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        ({productDetails.piecesPerDozen} pieces)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {/* Total Items Value */}
            <button
              onClick={() => {
                setStatusFilter('All Status');
                setCurrentPage(1);
              }}
              className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <div className="text-left">
                  <p className="text-sm text-gray-600">Total Items Value</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {InventoryDataService.formatCurrency(itemStats.totalValue)}
                  </p>
                </div>
              </div>
            </button>

            {/* Views */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">Views</p>
                  <p className="text-lg font-semibold text-gray-900">{(inventoryItem.views || 0).toLocaleString()}</p>
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
                  <p className="text-lg font-semibold text-gray-900">{inventoryItem.favorites || 0}</p>
                </div>
              </div>
            </div>

            {/* Total Items in Orders */}
            <button
              onClick={() => {
                setStatusFilter('All Status');
                setCurrentPage(1);
              }}
              className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <div className="text-left">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-lg font-semibold text-gray-900">{itemStats.total}</p>
                </div>
              </div>
            </button>

            {/* Pending Items */}
            <button
              onClick={() => {
                setStatusFilter('PENDING');
                setCurrentPage(1);
              }}
              className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="text-left">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-lg font-semibold text-gray-900">
                  {itemStats.pending}
                </p>
              </div>
            </button>

            {/* Completed Items */}
            <button
              onClick={() => {
                setStatusFilter('COMPLETED');
                setCurrentPage(1);
              }}
              className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="text-left">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {itemStats.completed}
                </p>
              </div>
            </button>

            {/* Canceled Items */}
            <button
              onClick={() => {
                setStatusFilter('CANCELED');
                setCurrentPage(1);
              }}
              className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="text-left">
                <p className="text-sm text-gray-600">Canceled</p>
                <p className="text-lg font-semibold text-gray-900">
                  {itemStats.canceled}
                </p>
              </div>
            </button>

            {/* Returned Items */}
            <button
              onClick={() => {
                setStatusFilter('RETURNED');
                setCurrentPage(1);
              }}
              className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="text-left">
                <p className="text-sm text-gray-600">Returned</p>
                <p className="text-lg font-semibold text-gray-900">
                  {itemStats.returned}
                </p>
              </div>
            </button>

            {/* Damaged Items */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-left">
                <p className="text-sm text-gray-600">Damaged</p>
                <p className="text-lg font-semibold text-gray-900">{itemStats.damaged}</p>
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
                            <button
                              onClick={() => {
                                setStatusFilter('All Status');
                                setShowFilterDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm ${statusFilter === 'All Status' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              All Status
                            </button>
                            <button
                              onClick={() => {
                                setStatusFilter('COMPLETED');
                                setShowFilterDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm ${statusFilter === 'COMPLETED' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              Completed
                            </button>
                            <button
                              onClick={() => {
                                setStatusFilter('PENDING');
                                setShowFilterDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm ${statusFilter === 'PENDING' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              Pending
                            </button>
                            <button
                              onClick={() => {
                                setStatusFilter('CANCELLED');
                                setShowFilterDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm ${statusFilter === 'CANCELLED' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              Cancelled
                            </button>
                            <button
                              onClick={() => {
                                setStatusFilter('RETURNED');
                                setShowFilterDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm ${statusFilter === 'RETURNED' ? 'bg-[#f4f5fa] text-[#02016a] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
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
                        Customer
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
                        Reference
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
                  {(() => {
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const sliced = filteredPurchases.slice(startIndex, endIndex);
                    return sliced;
                  })().flatMap((purchase) => {
                    // Show each item in the purchase as a separate row
                    if (purchase.items && purchase.items.length > 0) {
                      return purchase.items.map((item, idx) => (
                        <tr key={`${purchase.id}-${item.id}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input type="checkbox" className="rounded border-gray-300" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {idx === 0 && (
                              new Date(purchase.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {idx === 0 && (
                              <div>
                                <div className="font-medium">{purchase.customerName}</div>
                                <div className="text-xs text-gray-500">{purchase.customerPhone}</div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {InventoryDataService.formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {idx === 0 && <div className="text-xs text-gray-500">{purchase.saleReference}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {idx === 0 && InventoryDataService.formatCurrency(purchase.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={item.status} size="sm" />
                              <select
                                value={item.status || 'PENDING'}
                                onChange={(e) => handleUpdateItemStatus(purchase.id, item.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="PENDING">Pending</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="RETURNED">Returned</option>
                                <option value="DAMAGED">Damaged</option>
                                <option value="CANCELED">Canceled</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ));
                    }
                    // Fallback if no items (legacy data)
                    return (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(purchase.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{purchase.customerName}</div>
                            <div className="text-xs text-gray-500">{purchase.customerPhone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {InventoryDataService.formatCurrency(purchase.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {purchase.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-xs text-gray-500">{purchase.saleReference}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {InventoryDataService.formatCurrency(purchase.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${InventoryDataService.getStatusColor(purchase.status)}`}>
                            {purchase.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
                            {new Date(purchase.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{purchase.customerName}</p>
                          <p className="text-xs text-gray-500">{purchase.customerPhone}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Price:</span>
                              <span className="text-gray-900">{InventoryDataService.formatCurrency(purchase.price)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Qty:</span>
                              <span className="text-gray-900">{purchase.quantity}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Total:</span>
                              <span className="text-gray-900">{InventoryDataService.formatCurrency(purchase.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Ref:</span>
                              <span className="text-gray-900">{purchase.saleReference}</span>
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
                  <select 
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1); // Reset to first page when changing items per page
                    }}
                  >
                    <option value={10}>10 Items per page</option>
                    <option value={25}>25 Items per page</option>
                    <option value={50}>50 Items per page</option>
                  </select>
                  <span className="text-sm text-gray-700">
                    {(() => {
                      const startIndex = (currentPage - 1) * itemsPerPage + 1;
                      const endIndex = Math.min(currentPage * itemsPerPage, filteredPurchases.length);
                      return `${startIndex}-${endIndex} of ${filteredPurchases.length} items`;
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    {currentPage} of {Math.ceil(filteredPurchases.length / itemsPerPage) || 1} pages
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredPurchases.length / itemsPerPage) || 1, prev + 1))}
                    disabled={currentPage >= Math.ceil(filteredPurchases.length / itemsPerPage)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
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
