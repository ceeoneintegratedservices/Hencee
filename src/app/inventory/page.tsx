'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryDataService, InventoryItem, InventorySummary } from '@/services/InventoryDataService';
import { NotificationContainer, useNotifications } from '@/components/Notification';
import {
  getInventoryProducts,
  updateInventoryProduct,
  deleteInventoryProduct,
  getInventoryExpiryAlerts,
  importInventoryProducts,
  recordProductDamage,
  getInventoryExpirySummary,
  listInventoryDamages,
  mapFlatRecordToPayload,
  type InventoryProduct,
  type InventoryImportResult,
  type CreateInventoryProduct,
  type InventoryExpirySummary,
  type InventoryDamageRecord,
  type InventoryDamageSummary,
  type InventoryDamageFilters,
} from '@/services/inventory';
import FilterByDateModal from '@/components/FilterByDateModal';
import TimePeriodSelector from '@/components/TimePeriodSelector';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getWarehouses, type Warehouse } from '@/services/categories';

type InventoryUnitsState = NonNullable<InventoryProduct['inventoryUnits']>;
type InventoryRow = InventoryItem & {
  warehouseId?: string;
  expiryWarehouseId?: string;
  sku?: string;
  expiryStatus?: string;
  inventoryUnits?: InventoryUnitsState;
  supplier?: string;
};

const splitCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((value) => value.trim());
};

const parseCsvText = (text: string): Record<string, string>[] => {
  const rows = text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length === 0) return [];
  const headers = splitCsvLine(rows[0]);
  return rows.slice(1).map((row) => {
    const values = splitCsvLine(row);
    return headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = values[index] ?? '';
      return record;
    }, {});
  });
};

const mapApiProductToInventoryItem = (product: InventoryProduct): InventoryRow => {
  const piecesInStock =
    product.inventoryUnits?.piecesInStock ?? product.quantity ?? 0;
  const sellingPrice = product.sellingPrice ?? 0;

  return {
    id: String(product.id),
    productName: product.name ?? 'Product',
    category: product.category ?? product.categoryName ?? 'General',
    unitPrice: sellingPrice,
    costPrice: product.purchasePrice ?? 0,
    inStock: piecesInStock,
    discount: 0,
    totalValue: sellingPrice * piecesInStock,
    status:
      product.status === 'PUBLISHED'
        ? 'Published'
        : product.status === 'DRAFT'
        ? 'Draft'
        : 'Unpublished',
    image: '',
    shortDescription: product.description,
    longDescription: product.description,
    expiryDate: product.expiryDate,
    returnPolicy: undefined,
    dateAdded: product.createdAt ?? new Date().toISOString(),
    lastOrder: product.updatedAt,
    views: 0,
    favorites: 0,
    brand: '',
    description: product.description,
    warehouseNumber: product.warehouse ?? 'N/A',
    supplier: product.outsourcedDetails?.supplierName,
    warehouseId: product.warehouseId,
    expiryWarehouseId: product.expiryWarehouseId,
    sku: product.sku,
    expiryStatus: product.expiryStatus,
    inventoryUnits: product.inventoryUnits,
  };
};

const EXPIRY_STATUS_META: Record<
  "healthy" | "warning" | "critical" | "expired",
  { label: string; color: string; badge: string; ring: string }
> = {
  healthy: {
    label: "Healthy",
    color: "text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700",
    ring: "#10B981",
  },
  warning: {
    label: "Warning",
    color: "text-amber-700",
    badge: "bg-amber-50 text-amber-700",
    ring: "#F59E0B",
  },
  critical: {
    label: "Critical",
    color: "text-orange-700",
    badge: "bg-orange-50 text-orange-700",
    ring: "#EA580C",
  },
  expired: {
    label: "Expired",
    color: "text-red-700",
    badge: "bg-red-50 text-red-700",
    ring: "#EF4444",
  },
};

export default function InventoryPage() {
  const router = useRouter();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  
  // Authentication check
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [inventoryItems, setInventoryItems] = useState<InventoryRow[]>([]);
  const [summaryData, setSummaryData] = useState<InventorySummary | null>(null);
  const [filteredItems, setFilteredItems] = useState<InventoryRow[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importingRows, setImportingRows] = useState(false);
  const [importResult, setImportResult] = useState<InventoryImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [expiryAlerts, setExpiryAlerts] = useState<InventoryRow[]>([]);
  const [expiryThreshold, setExpiryThreshold] = useState(30);
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [expirySummary, setExpirySummary] = useState<InventoryExpirySummary | null>(null);
  const [expirySummaryLoading, setExpirySummaryLoading] = useState(false);
  const [expirySummaryError, setExpirySummaryError] = useState<string | null>(null);
  const [damageModal, setDamageModal] = useState<{ open: boolean; product?: InventoryRow }>({
    open: false,
  });
  const [damageForm, setDamageForm] = useState({
    quantity: '',
    reason: '',
    action: 'discard',
    inspectorNotes: '',
    warehouseId: '',
  });
  const [recordingDamage, setRecordingDamage] = useState(false);
  const [damageLog, setDamageLog] = useState<InventoryDamageRecord[]>([]);
  const [damageSummary, setDamageSummary] = useState<InventoryDamageSummary | null>(null);
  const [damageLoading, setDamageLoading] = useState(false);
  const [damageError, setDamageError] = useState<string | null>(null);
  const [damageFilters, setDamageFilters] = useState({
    startDate: '',
    endDate: '',
    warehouseId: '',
    reason: '',
    action: '',
    productId: '',
  });
  
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

  const fetchInventoryData = useCallback(
    async (search?: string) => {
    setApiLoading(true);
    setApiError(null);
    try {
        const response = await getInventoryProducts({
          search: search || undefined,
          limit: 100,
        });

        const mappedItems = response.data.map(mapApiProductToInventoryItem);
      setInventoryItems(mappedItems);
      setFilteredItems(mappedItems);
      localStorage.setItem('inventoryItems', JSON.stringify(mappedItems));
      
      const summary = InventoryDataService.generateInventorySummary(mappedItems);
      setSummaryData(summary);
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      setApiError(err.message || 'Failed to load inventory');
      showError('Error', err.message || 'Failed to load inventory');
      setInventoryItems([]);
      setFilteredItems([]);
      setSummaryData(null);
    } finally {
      setApiLoading(false);
    }
    },
    [showError]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    const debounce = setTimeout(() => {
      fetchInventoryData(searchQuery);
    }, 400);
    return () => clearTimeout(debounce);
  }, [isAuthenticated, searchQuery, fetchInventoryData]);

  // Refresh data when returning to the page (e.g., from create page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        fetchInventoryData(searchQuery);
      }
    };

    const handleFocus = () => {
      if (isAuthenticated) {
        fetchInventoryData(searchQuery);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, searchQuery, fetchInventoryData]);

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const data = await getWarehouses();
        setWarehouses(data);
      } catch (error) {
        console.error('Failed to load warehouses', error);
      }
    };
    loadWarehouses();
  }, []);

  // Handle inventory item deletion
  const handleDeleteInventoryItem = async (id: string) => {
    try {
      await deleteInventoryProduct(id);
      // Refresh inventory data
      await fetchInventoryData(searchQuery);
      showSuccess('Success', 'Inventory item deleted successfully');
    } catch (err: any) {
      console.error('Error deleting inventory item:', err);
      showError('Error', err.message || 'Failed to delete inventory item');
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
  const handleImportCsv = async (file: File) => {
    setImportingRows(true);
    setImportError(null);
    setImportResult(null);
    try {
      const text = await file.text();
      const records = parseCsvText(text);
      if (!records.length) {
        throw new Error('The CSV file is empty.');
      }
      const rows = records.map((record) => mapFlatRecordToPayload(record));
      const result = await importInventoryProducts(rows as CreateInventoryProduct[]);
      setImportResult(result);
      showSuccess('Success', `Imported ${result.created} item(s)`);
      await fetchInventoryData(searchQuery);
      await fetchExpiryAlerts(expiryThreshold);
    } catch (error: any) {
      console.error('Import failed', error);
      setImportError(error.message || 'Failed to import inventory');
      showError('Error', error.message || 'Failed to import inventory');
    } finally {
      setImportingRows(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDamageSubmit = async () => {
    if (!damageModal.product) return;
    if (!damageForm.quantity || Number(damageForm.quantity) <= 0) {
      showError('Validation Error', 'Quantity must be greater than zero');
      return;
    }
    if (!damageForm.reason.trim()) {
      showError('Validation Error', 'Please provide a reason');
      return;
    }
    try {
      setRecordingDamage(true);
      await recordProductDamage(damageModal.product.id, {
        quantity: Number(damageForm.quantity),
        reason: damageForm.reason.trim(),
        warehouseId: damageForm.warehouseId || undefined,
        action: damageForm.action as 'discard' | 'return' | 'repair',
        inspectorNotes: damageForm.inspectorNotes.trim() || undefined,
      });
      showSuccess('Success', 'Damage recorded successfully');
      setDamageModal({ open: false });
      await fetchInventoryData(searchQuery);
      await fetchExpiryAlerts(expiryThreshold);
    } catch (error: any) {
      console.error('Damage recording failed', error);
      showError('Error', error.message || 'Failed to record damage');
    } finally {
      setRecordingDamage(false);
    }
  };

  const fetchExpiryAlerts = useCallback(
    async (threshold: number) => {
      setExpiryLoading(true);
      try {
        const alerts = await getInventoryExpiryAlerts(threshold);
        const mapped = alerts.map(mapApiProductToInventoryItem);
        setExpiryAlerts(mapped);
      } catch (error: any) {
        console.error('Failed to fetch expiry alerts', error);
        setExpiryAlerts([]);
        showError('Error', error.message || 'Failed to load expiry alerts');
      } finally {
        setExpiryLoading(false);
      }
    },
    [showError]
  );

  const fetchExpirySummary = useCallback(async () => {
    setExpirySummaryLoading(true);
    setExpirySummaryError(null);
    try {
      const summary = await getInventoryExpirySummary();
      setExpirySummary(summary);
    } catch (error: any) {
      console.error('Failed to fetch expiry summary', error);
      setExpirySummary(null);
      setExpirySummaryError(error?.message || 'Unable to load expiry summary');
    } finally {
      setExpirySummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchExpiryAlerts(expiryThreshold);
  }, [isAuthenticated, expiryThreshold, fetchExpiryAlerts]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchExpirySummary();
  }, [isAuthenticated, fetchExpirySummary]);

  const fetchDamageLog = useCallback(
    async (overrides: Partial<typeof damageFilters> = {}) => {
      if (!isAuthenticated) return;
      setDamageLoading(true);
      setDamageError(null);
      try {
        const merged = { ...damageFilters, ...overrides };
        const actionValue = merged.action?.trim() || '';
        const payload: InventoryDamageFilters = {
          startDate: merged.startDate || undefined,
          endDate: merged.endDate || undefined,
          warehouseId: merged.warehouseId || undefined,
          reason: merged.reason || undefined,
          productId: merged.productId || undefined,
          action: (actionValue === 'discard' || actionValue === 'return' || actionValue === 'repair'
            ? actionValue
            : undefined),
          page: 1,
          limit: 50,
        };
        const response = await listInventoryDamages(payload);
        setDamageLog(response.data || []);
        setDamageSummary(response.summary || null);
      } catch (error: any) {
        console.error('Failed to fetch damage log', error);
        setDamageError(error?.message || 'Unable to load damage log');
        setDamageLog([]);
        setDamageSummary(null);
      } finally {
        setDamageLoading(false);
      }
    },
    [damageFilters, isAuthenticated]
  );

  useEffect(() => {
    fetchDamageLog();
  }, [fetchDamageLog]);

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
  const formatNumber = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(value)) return "0";
    return Number(value).toLocaleString();
  };
  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString() : "—";
  const expiryTotals = expirySummary?.totals || {};
  const statusStatsRaw = (["healthy", "warning", "critical", "expired"] as const).map(
    (key) => ({
      key,
      label: EXPIRY_STATUS_META[key].label,
      value: Number(expiryTotals?.[key] ?? 0),
      color: EXPIRY_STATUS_META[key].color,
      badge: EXPIRY_STATUS_META[key].badge,
      ring: EXPIRY_STATUS_META[key].ring,
    })
  );
  const totalStatuses =
    expiryTotals?.total ??
    statusStatsRaw.reduce((sum, stat) => sum + (Number.isFinite(stat.value) ? stat.value : 0), 0);
  const statusStats = statusStatsRaw.map((stat) => ({
    ...stat,
    percent: totalStatuses ? Math.round((stat.value / totalStatuses) * 100) : 0,
  }));
  const donutGradient = (() => {
    if (!totalStatuses) return "#E5E7EB";
    let acc = 0;
    const segments = statusStats
      .filter((stat) => stat.value > 0)
      .map((stat) => {
        const start = (acc / totalStatuses) * 360;
        acc += stat.value;
        const end = (acc / totalStatuses) * 360;
        return `${stat.ring} ${start}deg ${end}deg`;
      });
    return segments.length ? `conic-gradient(${segments.join(",")})` : "#E5E7EB";
  })();
  const topWarehouses = (expirySummary?.warehouses ?? []).slice(0, 4);
  const upcomingExpiries = (expirySummary?.upcoming ?? []).slice(0, 5);

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
          title="Pharma Inventory" 
          sidebarOpen={showSidebar}
          setSidebarOpen={setShowSidebar}
        />
        
        <div className="p-4 sm:p-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Pharma Inventory</span>
            </nav>
          </div>

          {/* Inventory Summary */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Pharma Inventory Summary</h1>
              <div className="flex items-center space-x-4">
                <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => router.push('/inventory/create')}
                  className="bg-[#02016a] text-white px-4 py-2 rounded-lg hover:bg-[#03024a] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                    Add new inventory
                </button>
                  <button
                    onClick={() => {
                      setImportError(null);
                      setImportResult(null);
                      setShowImportModal(true);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Bulk import (CSV)
                  </button>
                </div>
                <TimePeriodSelector
                  selectedTimePeriod={selectedTimePeriod}
                  onTimePeriodChange={setSelectedTimePeriod}
                />
              </div>
            </div>

            {currentSummaryData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* All Products Card */}
                <div className="bg-[#02016a] text-white p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm">All Products</p>
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
                      <p className="text-[#8b8d97] text-sm">Low Pharma Stock</p>
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

          <section className="mb-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Expiry Risk Overview</h2>
                <p className="text-sm text-gray-500">
                  Live snapshot of healthy vs. at-risk stock and upcoming expiries.
                </p>
              </div>
              {expirySummaryLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 animate-spin text-gray-400" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Updating…
                </div>
              )}
            </div>
            {expirySummaryError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
                {expirySummaryError}
              </div>
            )}
            {expirySummaryLoading && !expirySummary ? (
              <div className="grid gap-4 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-48 bg-white rounded-lg shadow-sm border border-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : !expirySummary ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-lg p-6 text-sm text-gray-500">
                No expiry insights available yet.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative w-28 h-28">
                      <div
                        className="w-full h-full rounded-full"
                        style={{ background: donutGradient }}
                      ></div>
                      <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center text-center">
                        <p className="text-xs uppercase text-gray-500">Total</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {formatNumber(totalStatuses)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 flex-1">
                      {statusStats.map((stat) => (
                        <div key={stat.key}>
                          <div className="flex items-center justify-between text-sm">
                            <span className={`font-medium ${stat.color}`}>{stat.label}</span>
                            <span className="text-gray-500">{stat.percent}%</span>
                          </div>
                          <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${stat.percent}%`,
                                backgroundColor: stat.ring,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Based on current stock levels. Healthy items exclude anything marked as warning,
                    critical, or expired.
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Warehouse breakdown</h3>
                    <span className="text-xs text-gray-400">
                      Showing top {topWarehouses.length || 0}
                    </span>
                  </div>
                  {topWarehouses.length === 0 ? (
                    <p className="text-sm text-gray-500">No warehouse data yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {topWarehouses.map((warehouse, index) => {
                        const total =
                          warehouse.total ??
                          (warehouse.healthy ?? 0) +
                            (warehouse.warning ?? 0) +
                            (warehouse.critical ?? 0) +
                            (warehouse.expired ?? 0);
                        const percent = totalStatuses
                          ? Math.round(((total ?? 0) / totalStatuses) * 100)
                          : 0;
                        return (
                          <div key={`${warehouse.warehouseId || index}`}>
                            <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                              <span>{warehouse.warehouseName || "Warehouse"}</span>
                              <span>{formatNumber(total)}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500"
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 w-12 text-right">
                                {percent}%
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-500">
                              <span>
                                Healthy: <strong className="text-gray-700">{formatNumber(warehouse.healthy)}</strong>
                              </span>
                              <span>
                                Warning: <strong className="text-gray-700">{formatNumber(warehouse.warning)}</strong>
                              </span>
                              <span>
                                Critical: <strong className="text-gray-700">{formatNumber(warehouse.critical)}</strong>
                              </span>
                              <span>
                                Expired: <strong className="text-gray-700">{formatNumber(warehouse.expired)}</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Upcoming expiries</h3>
                    {upcomingExpiries.length > 5 && (
                      <span className="text-xs text-gray-400">
                        Showing 5 of {upcomingExpiries.length}
                      </span>
                    )}
                  </div>
                  {upcomingExpiries.length === 0 ? (
                    <p className="text-sm text-gray-500">No products nearing expiry.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingExpiries.map((item, index) => (
                        <div key={`${item.productId || index}`} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.productName || "Product"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.warehouseName || "Warehouse"} · {formatDate(item.expiryDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {item.daysRemaining != null
                                ? `${item.daysRemaining}d left`
                                : "—"}
                            </p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                item.status === "critical"
                                  ? "bg-red-50 text-red-700"
                                  : item.status === "warning"
                                  ? "bg-orange-50 text-orange-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {item.status || "healthy"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {expiryLoading ? (
            <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Loading expiry alerts...</p>
            </div>
          ) : expiryAlerts.length > 0 ? (
            <div className="mb-8 bg-white rounded-lg shadow-sm border border-orange-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-orange-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-orange-700">
                    {expiryAlerts.length} product{expiryAlerts.length === 1 ? '' : 's'} approaching expiry
                  </p>
                  <p className="text-xs text-gray-500">
                    Threshold: {expiryThreshold} day{expiryThreshold === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Alert window</label>
                  <select
                    value={expiryThreshold}
                    onChange={(e) => setExpiryThreshold(Number(e.target.value))}
                    className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-orange-500"
                  >
                    {[7, 14, 30, 60].map((value) => (
                      <option key={value} value={value}>
                        {value} days
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {expiryAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{alert.productName}</p>
                      <p className="text-xs text-gray-500">
                        Expires {alert.expiryDate ? new Date(alert.expiryDate).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700">{alert.inStock} pcs</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          alert.expiryStatus === 'critical'
                            ? 'bg-red-50 text-red-700'
                            : alert.expiryStatus === 'warning'
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {alert.expiryStatus || 'healthy'}
                      </span>
                    </div>
                  </div>
                ))}
                {expiryAlerts.length > 5 && (
                  <div className="p-4 text-sm text-gray-500">
                    Showing 5 of {expiryAlerts.length} alerts
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Damage Log */}
          <section className="mb-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Damage Log</h2>
                <p className="text-sm text-gray-500">
                  Inspection records, reasons, and actions taken across warehouses.
                </p>
              </div>
              <button
                onClick={() => fetchDamageLog()}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${damageLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 4v5h.582m15.418 2a8 8 0 10-15.418 2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Refresh
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4">
              <div className="p-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Start date</label>
                  <input
                    type="date"
                    value={damageFilters.startDate}
                    onChange={(e) => setDamageFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">End date</label>
                  <input
                    type="date"
                    value={damageFilters.endDate}
                    onChange={(e) => setDamageFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Action</label>
                  <select
                    value={damageFilters.action}
                    onChange={(e) => setDamageFilters((prev) => ({ ...prev, action: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All actions</option>
                    <option value="discard">Discard</option>
                    <option value="return">Return</option>
                    <option value="repair">Repair</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Warehouse</label>
                  <select
                    value={damageFilters.warehouseId}
                    onChange={(e) => setDamageFilters((prev) => ({ ...prev, warehouseId: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All warehouses</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Reason</label>
                  <input
                    type="text"
                    value={damageFilters.reason}
                    onChange={(e) => setDamageFilters((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g. expired"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Product ID/SKU</label>
                  <input
                    type="text"
                    value={damageFilters.productId}
                    onChange={(e) => setDamageFilters((prev) => ({ ...prev, productId: e.target.value }))}
                    placeholder="Optional"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => fetchDamageLog()}
                    className="w-full bg-[#02016a] text-white px-4 py-2 rounded-lg hover:bg-[#03024a] transition-colors text-sm font-medium"
                  >
                    Apply filters
                  </button>
                  <button
                    onClick={() => {
                      setDamageFilters({
                        startDate: '',
                        endDate: '',
                        warehouseId: '',
                        reason: '',
                        action: '',
                        productId: '',
                      });
                      fetchDamageLog({
                        startDate: '',
                        endDate: '',
                        warehouseId: '',
                        reason: '',
                        action: '',
                        productId: '',
                      });
                    }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3 mb-4">
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                <p className="text-xs uppercase text-gray-500">Total damage cases</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(damageSummary?.totalDamages)}
                </p>
                <p className="text-xs text-gray-500 mt-1">All recorded inspections</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                <p className="text-xs uppercase text-gray-500">Units affected</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(damageSummary?.totalQuantity)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total damaged quantity</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                <p className="text-xs uppercase text-gray-500">Top reasons</p>
                {damageSummary?.quantityByReason ? (
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {Object.entries(damageSummary.quantityByReason)
                      .sort((a, b) => Number(b[1]) - Number(a[1]))
                      .slice(0, 3)
                      .map(([reason, qty]) => (
                        <div key={reason} className="flex justify-between">
                          <span className="capitalize">{reason || 'Other'}</span>
                          <span className="text-gray-900 font-medium">{formatNumber(qty)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">No reason data yet.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Damage records</h3>
                {damageLoading && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3-3"
                      ></path>
                    </svg>
                    Loading…
                  </span>
                )}
              </div>
              {damageError ? (
                <div className="p-6 text-sm text-red-600">{damageError}</div>
              ) : damageLog.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">No damage records found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {damageLog.map((record) => (
                        <tr key={record.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-medium">{record.productName || 'Product'}</div>
                            <div className="text-xs text-gray-500">{record.sku || record.productId}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 capitalize">{record.reason || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 capitalize">{record.action || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>{record.warehouseName || '—'}</div>
                            <div className="text-xs text-gray-500">{record.warehouseId}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>{formatDate(record.createdAt)}</div>
                            <div className="text-xs text-gray-500">
                              By {record.recordedByName || record.recordedBy || 'Unknown'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Inventory Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Pharma Products</h2>
                
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
                            onClick={() => fetchInventoryData(searchQuery)}
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDamageModal({ open: true, product: item });
                              setDamageForm({
                                quantity: '',
                                reason: '',
                                action: 'discard',
                                inspectorNotes: '',
                                warehouseId: item.warehouseId || '',
                              });
                            }}
                            className="mt-2 w-full text-xs text-red-600 border border-red-200 rounded-lg py-1 hover:bg-red-50 transition-colors"
                          >
                            Record damage
                          </button>
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
                      onClick={() => fetchInventoryData(searchQuery)}
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDamageModal({ open: true, product: item });
                              setDamageForm({
                                quantity: '',
                                reason: '',
                                action: 'discard',
                                inspectorNotes: '',
                                warehouseId: item.warehouseId || '',
                              });
                            }}
                            className="mt-2 w-full text-xs text-red-600 border border-red-200 rounded-lg py-1 hover:bg-red-50 transition-colors"
                          >
                            Record damage
                          </button>
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

      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Bulk import (CSV)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Map each column to the payload field names (e.g. <code className="font-mono">name</code>,{' '}
                  <code className="font-mono">sku</code>, <code className="font-mono">inventoryUnits.piecesInStock</code>).
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                id="import-csv-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImportCsv(file);
                  }
                }}
              />
              <label
                htmlFor="import-csv-input"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {importingRows ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 3v3m6.364-1.364l-2.121 2.121M21 12h-3m1.364 6.364l-2.121-2.121M12 21v-3m-6.364 1.364l2.121-2.121M3 12h3M4.636 5.636l2.121 2.121" />
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4M4 4l8 8 8-8" />
                    </svg>
                    Choose CSV file
                  </>
                )}
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Required columns: name, sku, categoryName, warehouseId, purchasePrice, sellingPrice, expiryDate.
              </p>
            </div>

            {importError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                {importError}
              </div>
            )}

            {importResult && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-1 border border-gray-100">
                <p>Processed rows: {importResult.total}</p>
                <p className="text-green-600">Created: {importResult.created}</p>
                {importResult.failed > 0 && (
                  <p className="text-red-600">Failed: {importResult.failed}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {damageModal.open && damageModal.product && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Record damaged stock</h3>
                <p className="text-sm text-gray-500 mt-1">{damageModal.product.productName}</p>
              </div>
              <button
                onClick={() => setDamageModal({ open: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={damageForm.quantity}
                  onChange={(e) => setDamageForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={damageForm.reason}
                  onChange={(e) => setDamageForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Broken bottle"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <select
                    value={damageForm.action}
                    onChange={(e) => setDamageForm((prev) => ({ ...prev, action: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="discard">Discard</option>
                    <option value="return">Return</option>
                    <option value="repair">Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse</label>
                  <select
                    value={damageForm.warehouseId}
                    onChange={(e) =>
                      setDamageForm((prev) => ({ ...prev, warehouseId: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Use product warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspector notes
                </label>
                <textarea
                  rows={3}
                  value={damageForm.inspectorNotes}
                  onChange={(e) =>
                    setDamageForm((prev) => ({ ...prev, inspectorNotes: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Leak detected on arrival"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDamageModal({ open: false })}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDamageSubmit}
                disabled={recordingDamage}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                {recordingDamage ? 'Recording...' : 'Record damage'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Filter Modal */}
      <FilterByDateModal
        isOpen={showDateFilterModal}
        onClose={() => setShowDateFilterModal(false)}
        onApply={handleDateFilter}
      />
    </div>
  );
}
