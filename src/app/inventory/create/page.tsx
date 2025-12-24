'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { NotificationContainer, useNotifications } from '@/components/Notification';
import {
  createInventoryProduct,
  type CreateInventoryProduct,
} from '@/services/inventory';
import {
  getCategories,
  type Category,
} from '@/services/categories';
import {
  getWarehouses,
  createWarehouse,
  type Warehouse,
} from '@/services/warehouses';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

const SIZE_UNITS = ['mg', 'g', 'kg', 'ml', 'l', 'capsule', 'tablet', 'sachet', 'vial'];
const STATUS_OPTIONS = [
  { label: 'Published', value: 'PUBLISHED' as const },
  { label: 'Draft', value: 'DRAFT' as const },
];

interface FormData {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  categoryName: string;
  warehouseId: string;
  expiryWarehouseId: string;
  purchasePrice: string;
  sellingPrice: string;
  pricePerPiece: string;
  pricePerCarton: string;
  pricePerRoll: string;
  piecesPerCarton: string;
  piecesPerRoll: string;
  productSize: string;
  productSizeUnit: string;
  expiryDate: string;
  piecesInStock: string;
  cartonsInStock: string;
  rollsInStock: string;
  reorderPoint: string;
  expiryAlertThreshold: string;
  isOutsourced: boolean;
  supplierName: string;
  sourceCostPrice: string;
  liveSellingPrice: string;
  outsourcedNotes: string;
  outsourcedImage?: string; // Image URL for outsourced product evidence
  outsourcedSalePrice: string; // Sale price when product is outsourced
  status: 'PUBLISHED' | 'DRAFT';
}

const DEFAULT_FORM: FormData = {
  name: '',
  sku: '',
  barcode: '',
  description: '',
  categoryName: '',
  warehouseId: '',
  expiryWarehouseId: '',
  purchasePrice: '',
    sellingPrice: '',
  pricePerPiece: '',
  pricePerCarton: '',
  pricePerRoll: '',
  piecesPerCarton: '',
  piecesPerRoll: '',
  productSize: '',
  productSizeUnit: 'mg',
    expiryDate: '',
  piecesInStock: '',
  cartonsInStock: '',
  rollsInStock: '',
  reorderPoint: '',
  expiryAlertThreshold: '30',
  isOutsourced: false,
  supplierName: '',
  sourceCostPrice: '',
  liveSellingPrice: '',
  outsourcedNotes: '',
  outsourcedImage: undefined,
  outsourcedSalePrice: '',
  status: 'PUBLISHED',
};

const numberValue = (value: string) =>
  value.trim() === '' ? undefined : Number(value);

export default function CreateInventoryPage() {
  const router = useRouter();
  const { notifications, removeNotification, showError, showSuccess } = useNotifications();

  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [useSameExpiryWarehouse, setUseSameExpiryWarehouse] = useState(true);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [warehouseSaving, setWarehouseSaving] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    address: '',
    capacity: '',
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      setIsAuthenticated(true);
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchDependencies = async () => {
      try {
        const [fetchedCategories, fetchedWarehouses] = await Promise.all([
          getCategories(),
          getWarehouses(),
        ]);
        setCategories(fetchedCategories);
        setWarehouses(fetchedWarehouses);

        setFormData((prev) => ({
          ...prev,
          categoryName: fetchedCategories[0]?.name || '',
          warehouseId: fetchedWarehouses[0]?.id || '',
          expiryWarehouseId: fetchedWarehouses[0]?.id || '',
        }));
      } catch (error) {
        console.error(error);
        showError('Error', 'Failed to load categories or warehouses');
      }
    };

    fetchDependencies();
  }, [isAuthenticated, showError]);

  useEffect(() => {
    if (useSameExpiryWarehouse) {
      setFormData((prev) => ({
      ...prev,
        expiryWarehouseId: prev.warehouseId,
      }));
    }
  }, [useSameExpiryWarehouse, formData.warehouseId]);

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      
      // Auto-fill piecesPerRoll with 12 when pricePerRoll is set and represents a dozen case
      // This handles the requirement: "when dozen selected it should prefill with 12"
      if (field === 'pricePerRoll' && value && typeof value === 'string' && value.trim() !== '') {
        // If pricePerRoll is being set, check if piecesPerRoll is empty and auto-fill with 12 for dozen
        if (!prev.piecesPerRoll || prev.piecesPerRoll.trim() === '') {
          updated.piecesPerRoll = '12';
        }
      }
      
      return updated;
    });
  };

  const handleWarehouseFieldChange = (field: keyof typeof newWarehouse, value: string) => {
    setNewWarehouse((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => setFormData(DEFAULT_FORM);
  const resetWarehouseForm = () => setNewWarehouse({ name: '', address: '', capacity: '' });

  const handleCreateWarehouse = async () => {
    if (!newWarehouse.name.trim()) {
      showError('Validation Error', 'Warehouse name is required');
      return;
    }
    
    setWarehouseSaving(true);
    try {
      const payload = {
        name: newWarehouse.name.trim(),
        address: newWarehouse.address.trim() || 'Not Provided',
        capacity: Number(newWarehouse.capacity) || 0,
        isActive: true,
      };
      const created = await createWarehouse(payload);

      setWarehouses((prev) => {
        const exists = prev.some((warehouse) => warehouse.id === created.id);
        return exists ? prev : [...prev, created];
      });

      updateForm('warehouseId', created.id);
      if (useSameExpiryWarehouse) {
        updateForm('expiryWarehouseId', created.id);
      }
      showSuccess('Success', 'Warehouse created successfully');
      setShowWarehouseForm(false);
      resetWarehouseForm();
    } catch (error: any) {
      console.error(error);
      showError('Error', error.message || 'Failed to create warehouse');
    } finally {
      setWarehouseSaving(false);
    }
  };

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!formData.name.trim()) errors.push('Product name is required');
    if (!formData.sku.trim()) errors.push('SKU is required');
    if (!formData.categoryName.trim()) errors.push('Category name is required');
    if (!formData.warehouseId) errors.push('Warehouse is required');
    if (!formData.expiryDate) errors.push('Expiry date is required');
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
      errors.push('Purchase price must be greater than zero');
    }
    if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) {
      errors.push('Selling price must be greater than zero');
    }
    return errors;
  }, [formData]);

  const buildPayload = (): CreateInventoryProduct => {
    const payload: CreateInventoryProduct = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      barcode: formData.barcode.trim() || undefined,
      description: formData.description.trim() || undefined,
      categoryName: formData.categoryName.trim(),
      warehouseId: formData.warehouseId,
      expiryWarehouseId:
        useSameExpiryWarehouse ? formData.warehouseId : formData.expiryWarehouseId || undefined,
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      pricePerPiece: numberValue(formData.pricePerPiece),
      pricePerCarton: numberValue(formData.pricePerCarton),
      pricePerRoll: numberValue(formData.pricePerRoll),
      piecesPerCarton: numberValue(formData.piecesPerCarton),
      piecesPerRoll: numberValue(formData.piecesPerRoll),
      inventoryUnits: {
        piecesInStock: numberValue(formData.piecesInStock) ?? 0,
        cartonsInStock: numberValue(formData.cartonsInStock) ?? 0,
        rollsInStock: numberValue(formData.rollsInStock) ?? 0,
      },
      expiryDate: formData.expiryDate,
      productSize: formData.productSize.trim() || undefined,
      productSizeUnit: formData.productSizeUnit,
      reorderPoint: numberValue(formData.reorderPoint),
      expiryAlertThreshold: numberValue(formData.expiryAlertThreshold),
      isOutsourced: formData.isOutsourced,
      outsourcedDetails: formData.isOutsourced
        ? {
            supplierName: formData.supplierName.trim() || undefined,
            sourceCostPrice: numberValue(formData.sourceCostPrice),
            liveSellingPrice: numberValue(formData.liveSellingPrice),
            notes: formData.outsourcedNotes.trim() || undefined,
            image: formData.outsourcedImage || undefined,
            salePrice: numberValue(formData.outsourcedSalePrice),
          }
        : undefined,
      status: formData.status,
    };

    return payload;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationErrors.length > 0) {
      showError('Validation Error', validationErrors[0]);
      return;
    }
    
    try {
      setSubmitting(true);
      const payload = buildPayload();
      await createInventoryProduct(payload);
      showSuccess('Success', 'Pharma inventory item created successfully');
      resetForm();
      router.push('/inventory');
    } catch (error: any) {
      console.error(error);
      showError('Error', error.message || 'Failed to create inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading inventory form...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden">
      <Sidebar currentPage="inventory" sidebarOpen={showSidebar} setSidebarOpen={setShowSidebar} />
      <main className="flex-1 h-screen overflow-y-auto transition-all duration-300 relative">
        <Header 
          title="Add Pharma Inventory"
          sidebarOpen={showSidebar}
          setSidebarOpen={setShowSidebar}
        />
        
        <div className="p-4 sm:p-6">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-10">
              <section>
                <div className="flex flex-col gap-2 mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Product details</h1>
                  <p className="text-sm text-gray-500">
                    Capture the identifiers dispensary teams search for.
                  </p>
          </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                      value={formData.name}
                      onChange={(e) => updateForm('name', e.target.value)}
                      placeholder="Augmentin 625mg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                />
              </div>
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sku}
                      onChange={(e) => updateForm('sku', e.target.value)}
                      placeholder="AUG-625"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
              </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                      <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => updateForm('barcode', e.target.value)}
                      placeholder="1234567890123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category name <span className="text-red-500">*</span>
                    </label>
                      <input
                      type="text"
                      value={formData.categoryName}
                      onChange={(e) => updateForm('categoryName', e.target.value)}
                      list="category-suggestions"
                      placeholder="Tablets"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                    <datalist id="category-suggestions">
                      {categories.map((category) => (
                        <option key={category.id} value={category.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    placeholder="Broad spectrum antibiotic"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </section>

              <section>
                <div className="flex flex-col gap-2 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Warehousing</h2>
                  <p className="text-sm text-gray-500">
                    Select where this stock lives. Expiry warehouse can differ for cold-chain items.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Storage warehouse <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.warehouseId}
                      onChange={(e) => updateForm('warehouseId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select warehouse</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                          </option>
                      ))}
                    </select>
                    <div className="mt-2">
                      {showWarehouseForm ? (
                        <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Warehouse name
                            </label>
                    <input
                      type="text"
                              value={newWarehouse.name}
                              onChange={(e) => handleWarehouseFieldChange('name', e.target.value)}
                              placeholder="e.g. Lekki Depot"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                  </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Address / Location
                    </label>
                    <input
                                type="text"
                                value={newWarehouse.address}
                                onChange={(e) => handleWarehouseFieldChange('address', e.target.value)}
                                placeholder="Optional"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Capacity (units)
                    </label>
                    <input
                      type="number"
                                value={newWarehouse.capacity}
                                onChange={(e) => handleWarehouseFieldChange('capacity', e.target.value)}
                                min={0}
                                placeholder="0"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                              type="button"
                              onClick={handleCreateWarehouse}
                              disabled={warehouseSaving}
                              className={`px-3 py-1.5 rounded-md text-sm text-white ${
                                warehouseSaving
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-indigo-600 hover:bg-indigo-700'
                              }`}
                            >
                              {warehouseSaving ? 'Saving...' : 'Save warehouse'}
                  </button>
                  <button
                              type="button"
                              onClick={() => {
                                setShowWarehouseForm(false);
                                resetWarehouseForm();
                              }}
                              className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-600 hover:bg-gray-100"
                            >
                              Cancel
                  </button>
                </div>
              </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowWarehouseForm(true)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          + Add new warehouse
                        </button>
                      )}
                  </div>
                </div>
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry warehouse
                </label>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        id="same-warehouse"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        checked={useSameExpiryWarehouse}
                        onChange={(e) => setUseSameExpiryWarehouse(e.target.checked)}
                      />
                      <label htmlFor="same-warehouse" className="text-sm text-gray-600">
                        Use storage warehouse
                    </label>
                </div>
                      <select
                      value={formData.expiryWarehouseId}
                      onChange={(e) => updateForm('expiryWarehouseId', e.target.value)}
                      disabled={useSameExpiryWarehouse}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                    >
                      <option value="">Select warehouse</option>
                      {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                          </option>
                      ))}
                      </select>
                    </div>
                  </div>
              </section>

              <section>
                <div className="flex flex-col gap-2 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Pricing</h2>
                  <p className="text-sm text-gray-500">
                    Capture unit prices so the sales workflow can pick the right package.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase price <span className="text-red-500">*</span>
                    </label>
                      <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) => updateForm('purchasePrice', e.target.value)}
                      placeholder="3500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                    </div>
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base selling price <span className="text-red-500">*</span>
                </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.sellingPrice}
                      onChange={(e) => updateForm('sellingPrice', e.target.value)}
                      placeholder="5000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                />
              </div>
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per piece
                </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pricePerPiece}
                      onChange={(e) => updateForm('pricePerPiece', e.target.value)}
                      placeholder="5000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                    />
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per carton
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pricePerCarton}
                      onChange={(e) => updateForm('pricePerCarton', e.target.value)}
                      placeholder="60000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                  />
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per roll
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pricePerRoll}
                      onChange={(e) => updateForm('pricePerRoll', e.target.value)}
                      placeholder="15000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                    />
                </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pieces per carton
                </label>
                        <input
                    type="number"
                        min="0"
                        value={formData.piecesPerCarton}
                        onChange={(e) => updateForm('piecesPerCarton', e.target.value)}
                        placeholder="12"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                      />
                    </div>
                    <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pieces per roll
                </label>
                        <input
                        type="number"
                        min="0"
                        value={formData.piecesPerRoll}
                        onChange={(e) => updateForm('piecesPerRoll', e.target.value)}
                        placeholder="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                      />
                      </div>
                    </div>
                  </div>
              </section>

              <section>
                <div className="flex flex-col gap-2 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Inventory units</h2>
                  <p className="text-sm text-gray-500">
                    Add counts for each unit. These values feed the sales workflow.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pieces in stock
                </label>
                      <input
                      type="number"
                      min="0"
                      value={formData.piecesInStock}
                      onChange={(e) => updateForm('piecesInStock', e.target.value)}
                      placeholder="24"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cartons in stock
                    </label>
                      <input
                        type="number"
                      min="0"
                      value={formData.cartonsInStock}
                      onChange={(e) => updateForm('cartonsInStock', e.target.value)}
                      placeholder="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                      />
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rolls in stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.rollsInStock}
                      onChange={(e) => updateForm('rollsInStock', e.target.value)}
                      placeholder="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                    />
                      </div>
                    </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reorder point
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.reorderPoint}
                      onChange={(e) => updateForm('reorderPoint', e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                    />
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry alert threshold (days)
                    </label>
                  <input
                      type="number"
                      min="1"
                      value={formData.expiryAlertThreshold}
                      onChange={(e) => updateForm('expiryAlertThreshold', e.target.value)}
                      placeholder="30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                  />
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                      value={formData.status}
                      onChange={(e) => updateForm('status', e.target.value as FormData['status'])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                          </option>
                      ))}
                      </select>
              </div>
                  </div>
              </section>

              <section>
                <div className="flex flex-col gap-2 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Pharma specifics</h2>
                  <p className="text-sm text-gray-500">
                    Set the size and expiry so the dashboard can alert the team before stock spoils.
                  </p>
                      </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product size
                </label>
                      <input
                      type="text"
                      value={formData.productSize}
                      onChange={(e) => updateForm('productSize', e.target.value)}
                      placeholder="625"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                      />
                    </div>
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size unit
                </label>
                    <select
                      value={formData.productSizeUnit}
                      onChange={(e) => updateForm('productSizeUnit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                    >
                      {SIZE_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry date <span className="text-red-500">*</span>
                    </label>
                      <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => updateForm('expiryDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                      required
                      />
                    </div>
                </div>
              </section>

              <section>
                <div className="flex flex-col gap-2 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Outsourcing</h2>
                  <p className="text-sm text-gray-500">
                    Capture the upstream supplier if this SKU is fulfilled externally.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">Is this product outsourced?</p>
                  <button
                      type="button"
                      onClick={() => updateForm('isOutsourced', !formData.isOutsourced)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.isOutsourced ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          formData.isOutsourced ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                  {formData.isOutsourced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Supplier name
                        </label>
                      <input
                          type="text"
                          value={formData.supplierName}
                          onChange={(e) => updateForm('supplierName', e.target.value)}
                          placeholder="ABC Pharma"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Supplier cost price
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.sourceCostPrice}
                          onChange={(e) => updateForm('sourceCostPrice', e.target.value)}
                          placeholder="3200"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                        />
                      </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Live selling price
                        </label>
                      <input
                        type="number"
                          min="0"
                          step="0.01"
                          value={formData.liveSellingPrice}
                          onChange={(e) => updateForm('liveSellingPrice', e.target.value)}
                          placeholder="5100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                      />
                    </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sale price (when outsourced)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.outsourcedSalePrice}
                          onChange={(e) => updateForm('outsourcedSalePrice', e.target.value)}
                          placeholder="5000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Internal notes
                        </label>
                        <textarea
                          rows={3}
                          value={formData.outsourcedNotes}
                          onChange={(e) => updateForm('outsourcedNotes', e.target.value)}
                          placeholder="Keep internal only"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product image evidence
                        </label>
                        <div className="mt-1 flex items-center gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const result = await uploadImage(file, { folder: 'outsourced-products' });
                                  updateForm('outsourcedImage', result.secure_url);
                                  showSuccess('Success', 'Image uploaded successfully');
                                } catch (error: any) {
                                  showError('Error', error.message || 'Failed to upload image');
                                }
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                          {formData.outsourcedImage && (
                            <div className="relative">
                              <img src={formData.outsourcedImage} alt="Product evidence" className="h-20 w-20 object-cover rounded-lg border border-gray-300" />
                              <button
                                type="button"
                                onClick={() => updateForm('outsourcedImage', undefined)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                        {uploadProgress.isUploading && (
                          <p className="mt-1 text-sm text-gray-500">Uploading... {uploadProgress.progress}%</p>
                        )}
                      </div>
                  </div>
                )}
              </div>
              </section>

              <div className="flex items-center justify-end gap-3">
                        <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                  Cancel
                        </button>
                        <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
                        >
                  {submitting ? 'Saving...' : 'Save product'}
                        </button>
            </div>
            </form>
          </div>
        </div>
      </main>
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </div>
  );
}

