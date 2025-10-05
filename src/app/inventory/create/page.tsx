'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryDataService } from '@/services/InventoryDataService';
import { NotificationContainer, useNotifications } from '@/components/Notification';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { createTire } from '@/services/tires';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { getCategories, getWarehouses, type Category, type Warehouse } from '@/services/categories';

interface FormData {
  productName: string;
  category: string;
  sellingPrice: string;
  costPrice: string;
  quantityInStock: string;
  productBrand: string;
  warehouseNumber: string;
  addDiscount: boolean;
  discountType: string;
  discountValue: string;
  addExpiryDate: boolean;
  expiryDate: string;
  shortDescription: string;
  longDescription: string;
  addReturnPolicy: boolean;
  returnPolicyDate: string;
  returnPolicyTime: string;
  sku: string;
}

export default function CreateInventoryPage() {
  const router = useRouter();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  
  // Authentication check
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    category: '',
    sellingPrice: '',
    costPrice: '',
    quantityInStock: '1',
    productBrand: '',
    warehouseNumber: '',
    addDiscount: false,
    discountType: 'percentage',
    discountValue: '',
    addExpiryDate: false,
    expiryDate: '',
    shortDescription: '',
    longDescription: '',
    addReturnPolicy: false,
    returnPolicyDate: '',
    returnPolicyTime: '12:00 PM',
    sku: ''
  });

  // Image states
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  
  // Cloudinary upload hook
  const { uploadImage, uploadProgress, resetUpload } = useCloudinaryUpload();
  
  // Categories and warehouses state
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  // Tyre brands list
  const tyreBrands = [
    'Michelin',
    'Bridgestone',
    'Continental',
    'Pirelli',
    'Goodyear',
    'Dunlop',
    'Hankook',
    'Yokohama',
    'Maxxis',
    'Firestone',
    'Cooper',
    'Falken',
    'Nexen',
    'Kumho',
    'Toyo',
    'Nitto',
    'BFGoodrich',
    'General',
    'Uniroyal',
    'Vredestein'
  ];

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

  // Fetch categories and warehouses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, warehousesData] = await Promise.all([
          getCategories(),
          getWarehouses()
        ]);
        setCategories(categoriesData);
        setWarehouses(warehousesData);
        
        // Debug logging
        console.log('Fetched Categories:', categoriesData);
        console.log('Fetched Warehouses:', warehousesData);
        
        // Set default selections if available
        if (categoriesData.length > 0) {
          setSelectedCategoryId(categoriesData[0].id);
          console.log('Auto-selected category:', categoriesData[0].name, 'ID:', categoriesData[0].id);
        }
        if (warehousesData.length > 0) {
          setSelectedWarehouseId(warehousesData[0].id);
          console.log('Auto-selected warehouse:', warehousesData[0].name, 'ID:', warehousesData[0].id);
        }
      } catch (error) {
        console.error('Error fetching categories and warehouses:', error);
        // Set fallback values
        setSelectedCategoryId('default-category-id');
        setSelectedWarehouseId('default-warehouse-id');
      }
    };
    
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuantityChange = (increment: boolean) => {
    const currentQuantity = parseInt(formData.quantityInStock) || 1;
    const newQuantity = increment ? currentQuantity + 1 : Math.max(1, currentQuantity - 1);
    setFormData(prev => ({
      ...prev,
      quantityInStock: newQuantity.toString()
    }));
  };

  const handleImageUpload = async (file: File, isMain: boolean = false) => {
    try {
      // Upload to Cloudinary
      const result = await uploadImage(file, {
        folder: 'inventory',
        transformation: {
          width: 800,
          height: 600,
          crop: 'fill',
          gravity: 'auto',
          quality: 'auto',
          format: 'auto'
        }
      });

      if (isMain) {
        setMainImage(result.secure_url);
        showSuccess('Success', 'Main image uploaded successfully');
      } else {
        setAdditionalImages(prev => [...prev, result.secure_url]);
        showSuccess('Success', 'Additional image uploaded successfully');
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      showError('Upload Error', error.message || 'Failed to upload image');
    }
  };

  const removeImage = (index: number, isMain: boolean = false) => {
    if (isMain) {
      setMainImage(null);
    } else {
      setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveAsDraft = async () => {
    // Validate required fields
    if (!formData.productName.trim()) {
      showError('Validation Error', 'Product name is required');
      return;
    }
    
    try {
      // Create tire object from form data - matching backend expectations
      const tireData = {
        name: formData.productName, // Required field
        description: formData.shortDescription,
        sku: formData.sku || `TIRE-${Date.now()}`, // Generate unique SKU if not provided
        categoryId: selectedCategoryId || "default-category-id",
        warehouseId: selectedWarehouseId || "default-warehouse-id",
        purchasePrice: parseFloat(formData.costPrice) || 0, // Backend expects purchasePrice
        sellingPrice: parseFloat(formData.sellingPrice) || 0, // Backend expects sellingPrice
        quantity: parseInt(formData.quantityInStock) || 0,
        brand: formData.productBrand,
        coverImage: mainImage || "", // Backend expects coverImage (single URL)
        additionalImages: additionalImages.map(url => ({ url })), // Backend expects array of objects with url property
        status: 'DRAFT' as const // Backend expects uppercase
      };
      
      // Debug logging
      console.log('Selected Category ID:', selectedCategoryId);
      console.log('Selected Warehouse ID:', selectedWarehouseId);
      console.log('Tire Data being sent:', tireData);
      
      // Send data to API
      await createTire(tireData);
      
      showSuccess('Success', 'Tire saved as draft successfully');
      router.push('/inventory');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save tire');
      console.error("Error saving tire:", error);
    }
  };

  const handleSaveAndPublish = async () => {
    // Validate required fields
    if (!formData.productName.trim()) {
      showError('Validation Error', 'Product name is required');
      return;
    }
    if (!selectedCategoryId) {
      showError('Validation Error', 'Product category is required');
      return;
    }
    if (!formData.sellingPrice.trim()) {
      showError('Validation Error', 'Selling price is required');
      return;
    }
    if (!formData.costPrice.trim()) {
      showError('Validation Error', 'Cost price is required');
      return;
    }
    
    try {
      // Create tire object from form data - matching backend expectations
      const tireData = {
        name: formData.productName, // Required field
        description: formData.shortDescription,
        sku: formData.sku || `TIRE-${Date.now()}`, // Generate unique SKU if not provided
        categoryId: selectedCategoryId || "default-category-id",
        warehouseId: selectedWarehouseId || "default-warehouse-id",
        purchasePrice: parseFloat(formData.costPrice) || 0, // Backend expects purchasePrice
        sellingPrice: parseFloat(formData.sellingPrice) || 0, // Backend expects sellingPrice
        quantity: parseInt(formData.quantityInStock) || 0,
        brand: formData.productBrand,
        coverImage: mainImage || "", // Backend expects coverImage (single URL)
        additionalImages: additionalImages.map(url => ({ url })), // Backend expects array of objects with url property
        status: 'PUBLISHED' as const // Backend expects uppercase
      };
      
      // Debug logging
      console.log('Selected Category ID:', selectedCategoryId);
      console.log('Selected Warehouse ID:', selectedWarehouseId);
      console.log('Tire Data being sent:', tireData);
      
      // Send data to API
      await createTire(tireData);
      
      showSuccess('Success', 'Tire saved and published successfully');
      router.push('/inventory');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save tire');
      console.error("Error saving tire:", error);
    }
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

  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar currentPage="inventory" sidebarOpen={showSidebar} setSidebarOpen={setShowSidebar} />
      
      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto transition-all duration-300 relative">
        <Header 
          title="Add New Tyre" 
          sidebarOpen={showSidebar}
          setSidebarOpen={setShowSidebar}
        />
        
        <div className="p-4 sm:p-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Inventory</span>
              <span>/</span>
              <span>New Inventory</span>
            </nav>
          </div>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">New Inventory Item</h1>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <div className="relative">
                <button
                  onClick={handleSaveAsDraft}
                  className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
                >
                  Save as Draft
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleSaveAndPublish}
                className="bg-[#02016a] text-white px-6 py-3 rounded-lg hover:bg-[#03024a] transition-colors"
              >
                Save & Publish
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Product Details */}
            <div className="space-y-6">
              {/* Product Name */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                  placeholder="Product Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* SKU */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Enter SKU (e.g., TIRE-001, MIC-205-55R16)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate SKU</p>
              </div>

              {/* Product Category */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tyre Category
                </label>
                <div className="relative">
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                    ) : (
                      <option value="">Loading categories...</option>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Type to search or select from popular tyre categories</p>
              </div>

              {/* Pricing */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price
                    </label>
                    <input
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                      placeholder="Selling Price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Price
                    </label>
                    <input
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => handleInputChange('costPrice', e.target.value)}
                      placeholder="Cost Price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity in Stock */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity in Stock
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(false)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    value={formData.quantityInStock}
                    onChange={(e) => handleInputChange('quantityInStock', e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                    min="1"
                  />
                  <button
                    onClick={() => handleQuantityChange(true)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Product Brand */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Brand
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.productBrand}
                    onChange={(e) => handleInputChange('productBrand', e.target.value)}
                    placeholder="Enter or select tyre brand"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    list="tyre-brands"
                  />
                  <datalist id="tyre-brands">
                    {tyreBrands.map((brand) => (
                      <option key={brand} value={brand} />
                    ))}
                  </datalist>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Type to search or select from popular tyre brands</p>
              </div>

              {/* Warehouse Selection */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse
                </label>
                <div className="relative">
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {warehouses.length > 0 ? (
                      warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} - {warehouse.location}
                        </option>
                      ))
                    ) : (
                      <option value="">Loading warehouses...</option>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Select the warehouse where this product will be stored</p>
              </div>

            </div>

            {/* Middle Column - Descriptions & Policies */}
            <div className="space-y-6">
              {/* Short Description */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Short Description"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Product Long Description */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Long Description
                </label>
                <div className="border border-gray-300 rounded-lg">
                  {/* Rich Text Editor Toolbar */}
                  <div className="border-b border-gray-300 p-3 flex items-center gap-2 flex-wrap">
                    <select className="text-sm border border-gray-300 rounded px-2 py-1">
                      <option>Roboto</option>
                    </select>
                    <select className="text-sm border border-gray-300 rounded px-2 py-1">
                      <option>Paragraph</option>
                    </select>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12M6 12h12M6 18h12" />
                        </svg>
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12M6 12h12M6 18h12" />
                        </svg>
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12M6 12h12M6 18h12" />
                        </svg>
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12M6 12h12M6 18h12" />
                        </svg>
                      </button>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    value={formData.longDescription}
                    onChange={(e) => handleInputChange('longDescription', e.target.value)}
                    placeholder="Your text goes here"
                    rows={8}
                    className="w-full px-3 py-2 border-0 focus:ring-0 resize-none"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Add a long description for your product</p>
              </div>

              {/* Return Policy */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-700">Return Policy</label>
                  <button
                    onClick={() => handleInputChange('addReturnPolicy', !formData.addReturnPolicy)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.addReturnPolicy ? 'bg-[#02016a]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.addReturnPolicy ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">Add Return Policy</span>
                </div>
                {formData.addReturnPolicy && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.returnPolicyDate}
                          onChange={(e) => handleInputChange('returnPolicyDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                      <div className="relative">
                        <input
                          type="time"
                          value={formData.returnPolicyTime}
                          onChange={(e) => handleInputChange('returnPolicyTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Discount */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-700">Discount</label>
                  <button
                    onClick={() => handleInputChange('addDiscount', !formData.addDiscount)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.addDiscount ? 'bg-[#02016a]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.addDiscount ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">Add Discount</span>
                </div>
                {formData.addDiscount && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={formData.discountType}
                        onChange={(e) => handleInputChange('discountType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                      <input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => handleInputChange('discountValue', e.target.value)}
                        placeholder="Value"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Images */}
            <div className="space-y-6">
              {/* Main Product Image */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Image (Cover Image)</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {uploadProgress.isUploading ? (
                    <div className="flex flex-col items-center justify-center h-48">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02016a] mb-4"></div>
                      <p className="text-gray-600 mb-2">Uploading to Cloudinary...</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#02016a] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{uploadProgress.progress}%</p>
                    </div>
                  ) : mainImage ? (
                    <div className="relative">
                      <img
                        src={mainImage}
                        alt="Main product"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={() => document.getElementById('main-image-upload')?.click()}
                          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                          disabled={uploadProgress.isUploading}
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeImage(0, true)}
                          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                          disabled={uploadProgress.isUploading}
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-600 mb-2">Upload Image</p>
                      <p className="text-sm text-gray-500 mb-4">Upload a cover image for your product.</p>
                      <p className="text-xs text-gray-400 mb-4">
                        File Format jpeg, png, webp<br />
                        Max Size 10MB
                      </p>
                      <button
                        onClick={() => document.getElementById('main-image-upload')?.click()}
                        className="px-4 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors disabled:opacity-50"
                        disabled={uploadProgress.isUploading}
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                  <input
                    id="main-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, true);
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Additional Images */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Images</h3>
                <div className="grid grid-cols-2 gap-4">
                  {additionalImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Additional ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => document.getElementById(`additional-image-upload-${index}`)?.click()}
                          className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
                        >
                          <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeImage(index)}
                          className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
                        >
                          <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <input
                        id={`additional-image-upload-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, false);
                        }}
                        className="hidden"
                      />
                    </div>
                  ))}
                  
                  {/* Add more images button */}
                  {additionalImages.length < 4 && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-xs text-gray-500 mb-2">Upload Image</p>
                      <button
                        onClick={() => document.getElementById('additional-image-upload-new')?.click()}
                        className="text-xs text-[#02016a] hover:text-[#03024a]"
                      >
                        Add Image
                      </button>
                      <input
                        id="additional-image-upload-new"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, false);
                        }}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Expiry Date */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                  <button
                    onClick={() => handleInputChange('addExpiryDate', !formData.addExpiryDate)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.addExpiryDate ? 'bg-[#02016a]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.addExpiryDate ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">Add Expiry Date</span>
                </div>
                {formData.addExpiryDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
}
