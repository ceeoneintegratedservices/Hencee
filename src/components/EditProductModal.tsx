'use client';

import React, { useState, useEffect } from 'react';
import { InventoryDataService, InventoryItem } from '@/services/InventoryDataService';

interface FormData {
  productName: string;
  category: string;
  sellingPrice: string;
  costPrice: string;
  quantityInStock: string;
  productBrand: string;
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
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData, mainImage: string | null, additionalImages: string[]) => void;
  inventoryItem: InventoryItem | null;
}

export default function EditProductModal({ isOpen, onClose, onSave, inventoryItem }: EditProductModalProps) {
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    category: '',
    sellingPrice: '',
    costPrice: '',
    quantityInStock: '1',
    productBrand: '',
    addDiscount: false,
    discountType: 'percentage',
    discountValue: '',
    addExpiryDate: false,
    expiryDate: '',
    shortDescription: '',
    longDescription: '',
    addReturnPolicy: false,
    returnPolicyDate: '',
    returnPolicyTime: '12:00 PM'
  });

  // Image states
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);

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

  // Initialize form data when inventory item changes
  useEffect(() => {
    if (inventoryItem && isOpen) {
      setFormData({
        productName: inventoryItem.productName || '',
        category: inventoryItem.category || '',
        sellingPrice: inventoryItem.unitPrice?.toString() || '',
        costPrice: inventoryItem.costPrice?.toString() || '',
        quantityInStock: inventoryItem.inStock?.toString() || '1',
        productBrand: inventoryItem.brand || '',
        addDiscount: false,
        discountType: 'percentage',
        discountValue: '',
        addExpiryDate: false,
        expiryDate: '',
        shortDescription: inventoryItem.description || '',
        longDescription: inventoryItem.longDescription || '',
        addReturnPolicy: false,
        returnPolicyDate: '',
        returnPolicyTime: '12:00 PM'
      });

      // Set images if available
      if (inventoryItem.image) {
        setMainImage(inventoryItem.image);
      }
      if (inventoryItem.additionalImages) {
        setAdditionalImages(inventoryItem.additionalImages);
      }
    }
  }, [inventoryItem, isOpen]);

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

  const handleImageUpload = (file: File, isMain: boolean = false) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (isMain) {
        setMainImage(result);
      } else {
        setAdditionalImages(prev => [...prev, result]);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number, isMain: boolean = false) => {
    if (isMain) {
      setMainImage(null);
    } else {
      setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    onSave(formData, mainImage, additionalImages);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Product Details */}
            <div className="space-y-6">
              {/* Product Name */}
              <div className="bg-gray-50 p-4 rounded-lg">
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

              {/* Product Category */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Tyre Category</option>
                  <option value="Passenger Car Tyres">Passenger Car Tyres</option>
                  <option value="SUV Tyres">SUV Tyres</option>
                  <option value="Truck Tyres">Truck Tyres</option>
                  <option value="Commercial Vehicle Tyres">Commercial Vehicle Tyres</option>
                  <option value="Motorcycle Tyres">Motorcycle Tyres</option>
                  <option value="All-Season Tyres">All-Season Tyres</option>
                  <option value="Summer Tyres">Summer Tyres</option>
                  <option value="Winter Tyres">Winter Tyres</option>
                  <option value="Performance Tyres">Performance Tyres</option>
                  <option value="Off-Road Tyres">Off-Road Tyres</option>
                  <option value="Run-Flat Tyres">Run-Flat Tyres</option>
                  <option value="Low Profile Tyres">Low Profile Tyres</option>
                </select>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 p-4 rounded-lg">
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
              <div className="bg-gray-50 p-4 rounded-lg">
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
              <div className="bg-gray-50 p-4 rounded-lg">
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

              {/* Discount */}
              <div className="bg-gray-50 p-4 rounded-lg">
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

              {/* Expiry Date */}
              <div className="bg-gray-50 p-4 rounded-lg">
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

            {/* Middle Column - Descriptions & Policies */}
            <div className="space-y-6">
              {/* Short Description */}
              <div className="bg-gray-50 p-4 rounded-lg">
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
              <div className="bg-gray-50 p-4 rounded-lg">
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
              <div className="bg-gray-50 p-4 rounded-lg">
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
            </div>

            {/* Right Column - Images */}
            <div className="space-y-6">
              {/* Main Product Image */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Image (Cover Image)</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {mainImage ? (
                    <div className="relative">
                      <img
                        src={mainImage}
                        alt="Main product"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          onClick={() => document.getElementById('main-image-upload')?.click()}
                          className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
                        >
                          <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeImage(0, true)}
                          className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
                        >
                          <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-600 mb-2 text-sm">Upload Image</p>
                      <p className="text-xs text-gray-500 mb-2">Upload a cover image for your product.</p>
                      <button
                        onClick={() => document.getElementById('main-image-upload')?.click()}
                        className="px-3 py-1 bg-[#02016a] text-white rounded text-sm hover:bg-[#03024a] transition-colors"
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
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Images</h3>
                <div className="grid grid-cols-2 gap-3">
                  {additionalImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Additional ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <div className="absolute top-1 right-1 flex gap-1">
                        <button
                          onClick={() => document.getElementById(`additional-image-upload-${index}`)?.click()}
                          className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
                        >
                          <svg className="w-2 h-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeImage(index)}
                          className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
                        >
                          <svg className="w-2 h-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                      <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-xs text-gray-500 mb-1">Upload Image</p>
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
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
