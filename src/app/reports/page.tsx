"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Breadcrumb from "@/components/Breadcrumb";
import { useNotifications } from "@/components/Notification";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getSalesReport, getFinanceReport, getDashboardOverview, getDashboardSales, getDashboardCustomers, getDashboardProducts, getDashboardOrders } from "@/services/reports";
import { listCustomers } from "@/services/customers";
import { getInventoryProducts } from "@/services/inventory";
import { listProducts } from "@/services/products";
import { fetchSalesDashboard, getSalesByDateRange } from "@/services/sales";
import { fetchOrdersDashboard, getOrdersByDateRange } from "@/services/orders";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Generate empty data structure for fallback
const generateEmptyData = () => {
  return {
    categories: [],
    products: [],
    customers: [],
    inventory: []
  };
};

export default function ReportsPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { showError, showSuccess } = useNotifications();
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [timeframe, setTimeframe] = useState("weekly");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<"excel" | "doc">("excel");
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showSalesTransactionsModal, setShowSalesTransactionsModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "turnover" | "increase" | "quantitySold">("turnover");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [chartZoom, setChartZoom] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [chartScrollPosition, setChartScrollPosition] = useState(0);
  const [showCurrentMonthTooltip, setShowCurrentMonthTooltip] = useState(true);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // API State
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState({
    salesReport: null as any,
    financeReport: null as any,
    customers: [] as any[],
    inventory: [] as any[],
    products: [] as any[],
    dashboardData: {
      overview: null as any,
      sales: null as any,
      customers: null as any,
      products: null as any,
      orders: null as any
    }
  });
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Modal data state
  const [salesTransactions, setSalesTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingSalesTransactions, setLoadingSalesTransactions] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  useEffect(() => {
    if (!authLoading) {
      setLoading(false);
      if (!isAuthenticated) {
        router.replace("/login");
      }
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch API data
  const fetchReportsData = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setApiError(null);
    
    try {
      // Map timeframe to backend format
      const timeframeMap: { [key: string]: string } = {
        'daily': 'thisWeek',
        'weekly': 'thisWeek', 
        'monthly': 'thisMonth',
        'yearly': 'allTime'  // Map yearly to allTime for comprehensive data
      };
      
      const backendTimeframe = timeframeMap[timeframe] || 'thisWeek';

      // Map timeframe to dateRange for reports
      // Backend only accepts: today, yesterday, this_week, last_week, this_month, last_month, 
      // this_quarter, last_quarter, this_year, last_year, custom
      const dateRangeMap: { [key: string]: string } = {
        'daily': 'today',
        'weekly': 'this_week', 
        'monthly': 'this_month',
        'yearly': 'this_year'  // Use this_year instead of all_time (not supported by backend)
      };
      
      const dateRange = dateRangeMap[timeframe] || 'this_month';

      // Fetch data from working backend endpoints
      const [salesReport, financeReport, customers, inventory, products] = await Promise.allSettled([
        getSalesReport({ dateRange }).catch((err) => {
          console.error('Error fetching sales report:', err);
          return null;
        }),
        getFinanceReport({ dateRange }).catch((err) => {
          console.error('Error fetching finance report:', err);
          return null;
        }),
        listCustomers().catch((err) => {
          console.error('Error fetching customers:', err);
          return [];
        }),
        getInventoryProducts().catch((err) => {
          console.error('Error fetching inventory:', err);
          return [];
        }),
        listProducts().catch((err) => {
          console.error('Error fetching products:', err);
          return [];
        })
      ]);

      const salesData = salesReport.status === 'fulfilled' ? salesReport.value : null;
      const financeData = financeReport.status === 'fulfilled' ? financeReport.value : null;
      
      // Comprehensive debug logging
      console.log('=== REPORTS API RESPONSES ===');
      console.log('Sales Report Status:', salesReport.status);
      console.log('Sales Report Data:', JSON.stringify(salesData, null, 2));
      console.log('Finance Report Status:', financeReport.status);
      console.log('Finance Report Data:', JSON.stringify(financeData, null, 2));
      
      if (salesReport.status === 'rejected') {
        console.error('Sales Report Error:', salesReport.reason);
      }
      if (financeReport.status === 'rejected') {
        console.error('Finance Report Error:', financeReport.reason);
      }

      setApiData({
        salesReport: salesData,
        financeReport: financeData,
        customers: customers.status === 'fulfilled' ? customers.value || [] : [],
        inventory:
          inventory.status === 'fulfilled'
            ? Array.isArray(inventory.value)
              ? inventory.value
              : inventory.value?.data || []
            : [],
        products: products.status === 'fulfilled' ? products.value || [] : [],
        dashboardData: {
          overview: null,
          sales: null,
          customers: null,
          products: null,
          orders: null
        }
      });

    } catch (err: any) {
      setApiError(err.message || 'Failed to load reports data');
      showError('Error', err.message || 'Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  // Load data when authenticated or timeframe changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchReportsData();
    }
  }, [isAuthenticated, timeframe]);

  // Fetch sales transactions when modal opens
  useEffect(() => {
    if (showSalesTransactionsModal && isAuthenticated) {
      const fetchSalesTransactions = async () => {
        setLoadingSalesTransactions(true);
        try {
          // Calculate date range based on timeframe
          const now = new Date();
          let dateFrom: string;
          let dateTo: string = now.toISOString().split('T')[0];
          
          if (timeframe === 'daily') {
            dateFrom = dateTo; // Today
          } else if (timeframe === 'weekly') {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            dateFrom = weekAgo.toISOString().split('T')[0];
          } else if (timeframe === 'monthly') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            dateFrom = monthAgo.toISOString().split('T')[0];
          } else if (timeframe === 'yearly') {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            dateFrom = yearAgo.toISOString().split('T')[0];
          } else {
            dateFrom = dateTo;
          }
          
          const data = await getSalesByDateRange(dateFrom, dateTo);
          setSalesTransactions(Array.isArray(data) ? data : []);
        } catch (error: any) {
          console.error('Error fetching sales transactions:', error);
          showError('Error', error.message || 'Failed to load sales transactions');
          setSalesTransactions([]);
        } finally {
          setLoadingSalesTransactions(false);
        }
      };
      
      fetchSalesTransactions();
    }
  }, [showSalesTransactionsModal, isAuthenticated, timeframe]);

  // Fetch orders when modal opens
  useEffect(() => {
    if (showOrdersModal && isAuthenticated) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          // Calculate date range based on timeframe
          const now = new Date();
          let dateFrom: string;
          let dateTo: string = now.toISOString().split('T')[0];
          
          if (timeframe === 'daily') {
            dateFrom = dateTo; // Today
          } else if (timeframe === 'weekly') {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            dateFrom = weekAgo.toISOString().split('T')[0];
          } else if (timeframe === 'monthly') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            dateFrom = monthAgo.toISOString().split('T')[0];
          } else if (timeframe === 'yearly') {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            dateFrom = yearAgo.toISOString().split('T')[0];
          } else {
            dateFrom = dateTo;
          }
          
          const data = await getOrdersByDateRange(dateFrom, dateTo);
          setOrders(Array.isArray(data) ? data : []);
        } catch (error: any) {
          console.error('Error fetching orders:', error);
          showError('Error', error.message || 'Failed to load orders');
          setOrders([]);
        } finally {
          setLoadingOrders(false);
        }
      };
      
      fetchOrders();
    }
  }, [showOrdersModal, isAuthenticated, timeframe]);

  // Generate data from API or fallback to empty data
  const getReportsData = () => {
    if (loading || apiError) {
      return generateEmptyData();
    }

    // Use API data to generate reports
    const { salesReport, financeReport, customers, inventory, products } = apiData;
    
    // Ensure we have arrays to work with
    const safeProducts = Array.isArray(products) ? products : [];
    const safeCustomers = Array.isArray(customers) ? customers : [];
    const safeInventory = Array.isArray(inventory) ? inventory : [];

    // Get sales report data
    const salesData = salesReport?.data || salesReport;
    const salesSummary = salesData?.summary;

    // Transform API data to match the expected format - Group by categories
    const categoryMap = new Map();
    
    // Use topCategories from sales report if available (most efficient)
    if (salesSummary && salesSummary.topCategories && Array.isArray(salesSummary.topCategories) && salesSummary.topCategories.length > 0) {
      // Use topCategories from summary (REAL DATA - most accurate)
      salesSummary.topCategories.forEach((category: any) => {
        categoryMap.set(category.name, {
          name: category.name,
          turnover: category.totalRevenue || 0,
          quantitySold: category.totalQuantity || 0,
          productCount: category.productCount || 0
        });
      });
    } else if (salesReport && salesData?.data && Array.isArray(salesData.data)) {
      // Fallback: Group by category from actual sales data in time-series
      salesData.data.forEach((period: any) => {
        if (period.products && Array.isArray(period.products)) {
          period.products.forEach((product: any) => {
            // Try to get category from product or use 'General'
            const categoryName = product.category?.name || product.categoryName || 'General';
            const revenue = product.revenue || product.totalSold * (product.unitPrice || 0) || 0;
            const quantitySold = product.totalSold || product.quantity || 0;
            
            if (categoryMap.has(categoryName)) {
              const existing = categoryMap.get(categoryName);
              existing.turnover += revenue;
              existing.quantitySold += quantitySold;
              existing.productCount += 1;
            } else {
              categoryMap.set(categoryName, {
                name: categoryName,
                turnover: revenue,
                quantitySold: quantitySold,
                productCount: 1
              });
            }
          });
        }
      });
    } else {
      // Fallback: Group products by category and calculate totals (less accurate)
      safeProducts.forEach((product: any) => {
        const categoryName = product.category?.name || 'General';
        const turnover = (product.sellingPrice || 0) * (product.quantity || 0);
        const costPrice = product.purchasePrice || product.costPrice || 0;
        const profit = turnover - (costPrice * (product.quantity || 0));
        
        if (categoryMap.has(categoryName)) {
          const existing = categoryMap.get(categoryName);
          existing.turnover += turnover;
          existing.profit += profit;
          existing.quantitySold += product.quantity || 0;
          existing.productCount += 1;
        } else {
          categoryMap.set(categoryName, {
            name: categoryName,
            turnover: turnover,
            profit: profit,
            quantitySold: product.quantity || 0,
            productCount: 1,
            brand: product.brand || 'Mixed'
          });
        }
      });
    }
    
    // Convert to array and calculate final metrics
    const categories = Array.from(categoryMap.values())
      .map(category => ({
        name: category.name,
        turnover: Math.round(category.turnover),
        increase: category.profit !== undefined 
          ? Math.round((category.turnover > 0 ? (category.profit / category.turnover) * 100 : 0) * 100) / 100
          : 0, // Only calculate if profit is available
        brand: category.brand,
        quantitySold: category.quantitySold || 0
      }))
      .sort((a, b) => b.turnover - a.turnover) // Sort by turnover descending
      .slice(0, 4); // Take top 4 categories

    // Use topProducts from sales report if available, otherwise use product list
    let transformedProducts: any[] = [];
    
    if (salesSummary && salesSummary.topProducts && Array.isArray(salesSummary.topProducts) && salesSummary.topProducts.length > 0) {
      // Use actual top products from sales report (REAL DATA)
      transformedProducts = salesSummary.topProducts.slice(0, 4).map((product: any) => {
        const productSize = product.productSize || product.dosageSize || product.size || product.strength;
        const productSizeUnit = product.productSizeUnit || product.dosageUnit || product.unit || product.sizeUnit;
        
        // Calculate profit margin if we have cost data
        const revenue = product.revenue || 0;
        const totalSold = product.totalSold || 0;
        const cost = product.cost || 0;
        const profitMargin = revenue > 0 && cost > 0 ? ((revenue - cost) / revenue) * 100 : 0;
        
        return {
          name: product.name || 'Unknown Product',
          id: product.id || 'N/A',
          category: product.category?.name || product.categoryName || 'General',
          quantity: `${totalSold} units`,
          turnover: Math.round(revenue),
          increase: Math.round(profitMargin * 100) / 100,
          productSize: productSize ? String(productSize) : undefined,
          productSizeUnit: productSizeUnit ? String(productSizeUnit) : undefined,
        };
      });
    } else {
      // Fallback: Use product list (less accurate)
      transformedProducts = safeProducts.slice(0, 4).map((product: any) => {
        const turnover = (product.sellingPrice || 0) * (product.quantity || 0);
        const costPrice = product.purchasePrice || product.costPrice || 0;
        const profit = turnover - (costPrice * (product.quantity || 0));
        const profitMargin = turnover > 0 ? (profit / turnover) * 100 : 0;
        
        // Get dosage size from multiple possible field names
        const productSize = product.productSize || product.dosageSize || product.size || product.strength;
        const productSizeUnit = product.productSizeUnit || product.dosageUnit || product.unit || product.sizeUnit;
        
        return {
          name: product.name || 'Unknown Product',
          id: product.id || 'N/A',
          category: product.category?.name || 'General',
          quantity: `${product.quantity || 0} units`,
          turnover: Math.round(turnover),
          increase: Math.round(profitMargin * 100) / 100, // Round to 2 decimal places
          productSize: productSize ? String(productSize) : undefined,
          productSizeUnit: productSizeUnit ? String(productSizeUnit) : undefined,
        };
      });
    }

    const transformedCustomers = safeCustomers.slice(0, 4).map((customer: any) => {
      const totalSpent = customer.orderTotal || customer.totalSpent || 0;
      const orderCount = customer.orders || customer.orderCount || 0;
      const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
      
      return {
        name: customer.name || 'Unknown Customer',
        orders: orderCount,
        totalSpent: totalSpent,
        lastOrder: customer.updatedAt ? new Date(customer.updatedAt).toISOString().split('T')[0] : 
                  customer.lastOrderDate ? new Date(customer.lastOrderDate).toISOString().split('T')[0] : 'N/A',
        status: customer.isActive ? 'Active' : 'Inactive'
      };
    });

    const transformedInventory = safeInventory.slice(0, 4).map((item: any) => {
      const currentStock = item.quantity || 0;
      const reorderPoint = item.reorderPoint || 10;
      const maxStock = item.maxStock || (currentStock * 2);
      const isLowStock = currentStock <= reorderPoint;
      const stockStatus = isLowStock ? 'Low' : currentStock > (reorderPoint * 2) ? 'Good' : 'Medium';
      
      return {
        product: item.name || 'Unknown Product',
        currentStock: currentStock,
        minStock: reorderPoint,
        maxStock: maxStock,
        status: stockStatus,
        reorder: isLowStock ? 'Yes' : 'No',
        supplier: item.supplier || item.warehouse?.name || 'Unknown Supplier'
      };
    });

    return {
      categories,
      products: transformedProducts,
      customers: transformedCustomers,
      inventory: transformedInventory
    };
  };

  const sampleData = getReportsData();

  // Calculate real metrics from API data - recalculates when timeframe or apiData changes
  const calculateMetrics = () => {
    const { salesReport, financeReport, customers, inventory, products } = apiData;
    
    // Extract metrics from finance report (primary source for overview metrics)
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalExpenses = 0;
    let netPurchaseValue = 0;
    let netSalesValue = 0;
    
    // Check if reports are null/undefined
    if (!financeReport && !salesReport) {
      console.warn('Both finance and sales reports are null/undefined');
    }
    
    if (financeReport) {
      // Handle case where response might be wrapped in a 'data' property
      const reportData = financeReport.data || financeReport;
      
      // Try to get from summary object first (preferred)
      if (reportData.summary) {
        totalRevenue = reportData.summary.totalRevenue || 0;
        totalProfit = reportData.summary.totalProfit || 0;
        totalExpenses = reportData.summary.totalExpenses || 0;
        // Net purchase value might be in expenses or calculated
        netPurchaseValue = totalExpenses || 0;
        netSalesValue = totalRevenue || 0;
      }
      
      // If summary doesn't have all fields, try to calculate from data array
      if (reportData.data && Array.isArray(reportData.data) && reportData.data.length > 0) {
        if (totalRevenue === 0) {
          totalRevenue = reportData.data.reduce((sum: number, item: any) => 
            sum + (item.revenue || item.totalRevenue || 0), 0);
        }
        if (totalProfit === 0) {
          totalProfit = reportData.data.reduce((sum: number, item: any) => 
        sum + (item.profit || item.netIncome || 0), 0);
        }
        if (totalExpenses === 0) {
          totalExpenses = reportData.data.reduce((sum: number, item: any) => 
            sum + (item.expenses || item.totalExpenses || 0), 0);
          netPurchaseValue = totalExpenses;
        }
        if (netSalesValue === 0) {
          netSalesValue = totalRevenue;
        }
      }
      
      // Check root level fields as fallback
      if (totalRevenue === 0 && typeof reportData.totalRevenue === 'number') {
        totalRevenue = reportData.totalRevenue;
      }
      if (totalProfit === 0 && typeof reportData.totalProfit === 'number') {
        totalProfit = reportData.totalProfit;
      }
      if (totalExpenses === 0 && typeof reportData.totalExpenses === 'number') {
        totalExpenses = reportData.totalExpenses;
        netPurchaseValue = totalExpenses;
      }
    }
    
    // Fallback to sales report for revenue if finance report doesn't have it
    if (totalRevenue === 0 && salesReport) {
      const salesData = salesReport.data || salesReport;
      
      if (salesData.summary && typeof salesData.summary.totalSales === 'number') {
        totalRevenue = salesData.summary.totalSales;
        netSalesValue = totalRevenue;
      } else if (salesData.data && Array.isArray(salesData.data) && salesData.data.length > 0) {
        totalRevenue = salesData.data.reduce((sum: number, item: any) => 
          sum + (item.totalSales || item.revenue || item.totalRevenue || 0), 0);
        netSalesValue = totalRevenue;
      } else if (typeof salesData.totalSales === 'number') {
        totalRevenue = salesData.totalSales;
        netSalesValue = totalRevenue;
      }
    }
    
    // Comprehensive debug logging
    console.log('=== METRICS CALCULATION ===');
    console.log('Finance Report:', financeReport);
    console.log('Finance Report Summary:', financeReport?.summary || financeReport?.data?.summary);
    console.log('Finance Report Data Array:', financeReport?.data);
    console.log('Sales Report:', salesReport);
    console.log('Sales Report Summary:', salesReport?.summary || salesReport?.data?.summary);
    console.log('Sales Report Data Array:', salesReport?.data);
    console.log('Calculated Metrics:', { 
      totalRevenue, 
      totalProfit, 
      totalExpenses, 
      netPurchaseValue, 
      netSalesValue 
    });
    console.log('========================');
    
    // Calculate total customers
    const totalCustomers = Array.isArray(customers) ? customers.length : 0;
    
    // Calculate total products
    const totalProducts = Array.isArray(products) ? products.length : 0;
    
    return {
      totalRevenue,
      totalProfit,
      totalExpenses,
      netPurchaseValue,
      netSalesValue,
      totalCustomers,
      totalProducts
    };
  };

  const metrics = calculateMetrics();
  
  // Generate chart data from API responses
  const generateChartData = () => {
    let allLabels: string[] = [];
    let allRevenueData: number[] = [];
    let allProfitData: number[] = [];
    
    // Use real API data if available
    if (apiData.salesReport && apiData.financeReport) {
      // Extract data from API responses
      if (apiData.salesReport.data && Array.isArray(apiData.salesReport.data)) {
        apiData.salesReport.data.forEach((item: any) => {
          allLabels.push(item.period || item.date || 'Unknown');
          allRevenueData.push(item.revenue || item.totalSales || 0);
        });
      }
      
      if (apiData.financeReport.data && Array.isArray(apiData.financeReport.data)) {
        apiData.financeReport.data.forEach((item: any) => {
          allProfitData.push(item.profit || item.netIncome || 0);
        });
      }
      
      // If we don't have enough data, pad with zeros
      while (allProfitData.length < allRevenueData.length) {
        allProfitData.push(0);
      }
      while (allRevenueData.length < allProfitData.length) {
        allRevenueData.push(0);
      }
    } else {
      // No API data available - show empty state
      // Generate minimal structure for empty state display
      if (chartZoom === 'daily') {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        allLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
        allRevenueData = Array(daysInMonth).fill(0);
        allProfitData = Array(daysInMonth).fill(0);
      } else if (chartZoom === 'monthly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        allLabels = months;
        allRevenueData = Array(12).fill(0);
        allProfitData = Array(12).fill(0);
      } else if (chartZoom === 'yearly') {
        const years = [];
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
          years.push(year.toString());
        }
        allLabels = years;
        allRevenueData = Array(years.length).fill(0);
        allProfitData = Array(years.length).fill(0);
      }
    }
    
    // Calculate visible range based on scroll position
    const itemsPerView = chartZoom === 'daily' ? 7 : chartZoom === 'yearly' ? 6 : chartZoom === 'monthly' ? 6 : 12;
    const maxScroll = Math.max(0, allLabels.length - itemsPerView);
    const startIndex = Math.min(chartScrollPosition, maxScroll);
    const endIndex = Math.min(startIndex + itemsPerView, allLabels.length);
    
    // Slice data based on scroll position
    const labels = allLabels.slice(startIndex, endIndex);
    const revenueData = allRevenueData.slice(startIndex, endIndex);
    const profitData = allProfitData.slice(startIndex, endIndex);
    
    // Calculate current month position for tooltip
    let currentMonthPosition = -1;
    let currentMonthData = { revenue: 0, profit: 0, label: '' };
    
    if (chartZoom === 'monthly') {
      const currentMonth = new Date().getMonth();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonthName = months[currentMonth];
      
      // Find current month in visible data
      const currentIndex = labels.findIndex(label => label === currentMonthName);
      if (currentIndex !== -1) {
        currentMonthPosition = currentIndex;
        currentMonthData = {
          revenue: revenueData[currentIndex],
          profit: profitData[currentIndex],
          label: currentMonthName
        };
      }
    } else if (chartZoom === 'daily') {
      const currentDay = new Date().getDate();
      const currentIndex = labels.findIndex(label => parseInt(label) === currentDay);
      if (currentIndex !== -1) {
        currentMonthPosition = currentIndex;
        currentMonthData = {
          revenue: revenueData[currentIndex],
          profit: profitData[currentIndex],
          label: `Day ${currentDay}`
        };
      }
    } else if (chartZoom === 'yearly') {
      const currentYear = new Date().getFullYear();
      // Only show current year indicator if it's 2025 or later
      if (currentYear >= 2025) {
        const currentIndex = labels.findIndex(label => parseInt(label) === currentYear);
        if (currentIndex !== -1) {
          currentMonthPosition = currentIndex;
          currentMonthData = {
            revenue: revenueData[currentIndex],
            profit: profitData[currentIndex],
            label: currentYear.toString()
          };
        }
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.4, // Creates smooth curves
          borderWidth: 3,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#2563EB',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
        {
          label: 'Profit',
          data: profitData,
          borderColor: '#F3E5AB',
          backgroundColor: 'rgba(243, 229, 171, 0.1)',
          tension: 0.4, // Creates smooth curves
          borderWidth: 3,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#F3E5AB',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }
      ],
      currentMonthPosition,
      currentMonthData
    };
  };

  const chartData = generateChartData();

  // Chart options for wavy curves
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 14,
            family: 'Inter, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context: any) {
            const label = context[0].label;
            if (chartZoom === 'daily') {
              return `Day ${label}`;
            } else if (chartZoom === 'monthly') {
              return label;
            } else if (chartZoom === 'yearly') {
              return `Year ${label}`;
            }
            return label;
          },
          label: function(context: any) {
            return `${context.dataset.label}: ₦${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            family: 'Inter, sans-serif'
          },
          color: '#6b7280',
          maxTicksLimit: chartZoom === 'daily' ? 7 : chartZoom === 'yearly' ? 6 : chartZoom === 'monthly' ? 6 : 12
        }
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: '#f3f4f6',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12,
            family: 'Inter, sans-serif'
          },
          color: '#6b7280',
          callback: function(value: any) {
            return `₦${value.toLocaleString()}`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  };
  
  // Calculate MoM and YoY profit from finance report data
  const calculateMoMAndYoYProfit = () => {
    const { financeReport } = apiData;
    let momProfit = 0;
    let yoyProfit = 0;
    
    // First, try to use backend-provided values (most accurate)
    const reportData = financeReport?.data || financeReport;
    if (reportData?.summary) {
      if (typeof reportData.summary.momProfit === 'number') {
        momProfit = reportData.summary.momProfit;
      }
      if (typeof reportData.summary.yoyProfit === 'number') {
        yoyProfit = reportData.summary.yoyProfit;
      }
    }
    
    // If backend didn't provide values, calculate from data array
    if ((momProfit === 0 || yoyProfit === 0) && financeReport?.data && Array.isArray(financeReport.data) && financeReport.data.length > 0) {
      // Sort data by period to get current and previous periods
      const sortedData = [...financeReport.data].sort((a: any, b: any) => {
        const dateA = new Date(a.period || a.date || 0);
        const dateB = new Date(b.period || b.date || 0);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
      
      // Calculate MoM if not provided by backend
      if (momProfit === 0 && sortedData.length >= 2) {
        const currentPeriod = sortedData[0];
        const previousPeriod = sortedData[1];
        
        const currentProfit = currentPeriod.profit || currentPeriod.netIncome || 0;
        const previousProfit = previousPeriod.profit || previousPeriod.netIncome || 0;
        
        // Calculate MoM (Month-over-Month) - compare current with previous
        momProfit = currentProfit - previousProfit;
      } else if (momProfit === 0 && sortedData.length === 1) {
        // Only one period available, use it as MoM
        momProfit = sortedData[0].profit || sortedData[0].netIncome || 0;
      }
      
      // Calculate YoY if not provided by backend
      if (yoyProfit === 0 && sortedData.length > 0) {
        const currentPeriod = sortedData[0];
        const currentDate = new Date(currentPeriod.period || currentPeriod.date || Date.now());
        const lastYearDate = new Date(currentDate);
        lastYearDate.setFullYear(currentDate.getFullYear() - 1);
        
        // Find matching period from last year
        const lastYearPeriod = sortedData.find((item: any) => {
          const itemDate = new Date(item.period || item.date || 0);
          return itemDate.getMonth() === lastYearDate.getMonth() && 
                 itemDate.getFullYear() === lastYearDate.getFullYear();
        });
        
        if (lastYearPeriod) {
          const currentProfit = currentPeriod.profit || currentPeriod.netIncome || 0;
          const lastYearProfit = lastYearPeriod.profit || lastYearPeriod.netIncome || 0;
          yoyProfit = currentProfit - lastYearProfit;
        } else {
          // If no matching period found, use current profit
          yoyProfit = currentPeriod.profit || currentPeriod.netIncome || 0;
        }
      }
    }
    
    // Final fallback: use total profit if calculations didn't work
    if (momProfit === 0 && yoyProfit === 0) {
      momProfit = metrics.totalProfit;
      yoyProfit = metrics.totalProfit;
    }
    
    return { momProfit, yoyProfit };
  };

  const { momProfit, yoyProfit } = calculateMoMAndYoYProfit();

  const overviewData = {
    totalProfit: metrics.totalProfit,
    revenue: metrics.totalRevenue,
    sales: metrics.totalRevenue, // Revenue and sales are the same
    netPurchaseValue: metrics.netPurchaseValue, // From expenses in finance report
    netSalesValue: metrics.netSalesValue, // Same as revenue
    momProfit: momProfit, // Calculated from finance report periods
    yoyProfit: yoyProfit // Calculated from finance report periods
  };

  // Export functionality
  const handleExport = (reportType: string) => {
    const data = sampleData[reportType as keyof typeof sampleData] || [];
    const filename = `${reportType}_${timeframe}_${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === "excel") {
      generateExcelFile(data, filename, reportType);
    } else {
      const docContent = generateDOC(data, reportType);
      downloadFile(docContent, `${filename}.doc`, 'application/msword');
    }
  };

  const handleBulkExport = () => {
    if (selectedReports.length === 0) return;
    
    const filename = `bulk_reports_${timeframe}_${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === "excel") {
      generateBulkExcelFile(filename);
    } else {
      const docContent = selectedReports.map(report => 
        generateDOC(sampleData[report as keyof typeof sampleData] || [], report)
      ).join('\n\n');
      downloadFile(docContent, `${filename}.doc`, 'application/msword');
    }
  };

  const toggleReportSelection = (reportType: string) => {
    setSelectedReports(prev => 
      prev.includes(reportType) 
        ? prev.filter(r => r !== reportType)
        : [...prev, reportType]
    );
  };

  // Excel export helper functions
  const generateExcelFile = (data: any[], filename: string, reportType: string) => {
    if (data.length === 0) return;
    
    // Create Excel-like structure with proper formatting
    const headers = Object.keys(data[0]);
    const excelContent = [
      // Header section
      [`REPORT: ${reportType.toUpperCase()}`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [`Timeframe: ${timeframe}`],
      [''], // Empty row
      // Table headers
      headers,
      // Data rows
      ...data.map(row => headers.map(header => row[header] || ''))
    ];
    
    // Convert to CSV format for Excel compatibility
    const csvContent = excelContent.map(row => 
      Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : `"${row}"`
    ).join('\n');
    
    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  };

  const generateBulkExcelFile = (filename: string) => {
    const excelContent: (string | string[])[] = [];
    
    selectedReports.forEach((report, index) => {
      const data = sampleData[report as keyof typeof sampleData] || [];
      
      if (index > 0) {
        excelContent.push(['']); // Empty row between reports
      }
      
      // Report header
      excelContent.push([`REPORT: ${report.toUpperCase()}`]);
      excelContent.push([`Generated: ${new Date().toLocaleDateString()}`]);
      excelContent.push([`Timeframe: ${timeframe}`]);
      excelContent.push(['']); // Empty row
      
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        excelContent.push(headers);
        excelContent.push(...data.map(row => headers.map(header => (row as any)[header] || '')));
      }
    });
    
    // Convert to CSV format
    const csvContent = excelContent.map(row => 
      Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : `"${row}"`
    ).join('\n');
    
    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  };

  const generateDOC = (data: any[], reportType: string) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const docContent = [
      `REPORT: ${reportType.toUpperCase()}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      `Timeframe: ${timeframe}`,
      '',
      headers.join('\t'),
      ...data.map(row => headers.map(header => row[header] || '').join('\t'))
    ];
    
    return docContent.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Chart interaction functions
  const handleChartZoom = (zoom: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setChartZoom(zoom);
    setChartScrollPosition(0); // Reset scroll position when changing timeframe
  };

  const handleChartScroll = (direction: 'left' | 'right') => {
    const itemsPerView = chartZoom === 'daily' ? 7 : chartZoom === 'yearly' ? 6 : chartZoom === 'monthly' ? 6 : 12;
    const totalItems = chartZoom === 'daily' ? 
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : 12;
    const maxScroll = Math.max(0, totalItems - itemsPerView);
    
    // Only allow scrolling if there's actually something to scroll
    if (maxScroll <= 0) {
      return;
    }
    
    if (direction === 'left' && chartScrollPosition > 0) {
      setChartScrollPosition(Math.max(0, chartScrollPosition - 1));
    } else if (direction === 'right' && chartScrollPosition < maxScroll) {
      setChartScrollPosition(Math.min(maxScroll, chartScrollPosition + 1));
    }
  };



  // Add keyboard navigation and mouse wheel handling
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleChartScroll('left');
      } else if (e.key === 'ArrowRight') {
        handleChartScroll('right');
      }
    };

    const handleWheelEvent = (e: WheelEvent) => {
      // Check if scrolling is possible for current timeframe
      const itemsPerView = chartZoom === 'daily' ? 7 : chartZoom === 'yearly' ? 6 : chartZoom === 'monthly' ? 6 : 12;
      const totalItems = chartZoom === 'daily' ? 
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : 12;
      const maxScroll = Math.max(0, totalItems - itemsPerView);
      
      // Only handle wheel events if scrolling is possible
      if (maxScroll <= 0) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      
      if (e.deltaY > 0) {
        handleChartScroll('right');
      } else if (e.deltaY < 0) {
        handleChartScroll('left');
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingScrollbar) return;
      
      const scrollBarElement = document.querySelector('[data-scrollbar-track]') as HTMLElement;
      if (!scrollBarElement) return;
      
      const rect = scrollBarElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const scrollBarWidth = 200;
      const itemsPerView = chartZoom === 'daily' ? 7 : chartZoom === 'yearly' ? 6 : chartZoom === 'monthly' ? 6 : 12;
      const totalItems = chartZoom === 'daily' ? 
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : 12;
      const maxScroll = Math.max(0, totalItems - itemsPerView);
      
      const newPosition = Math.round((clickX / scrollBarWidth) * maxScroll);
      setChartScrollPosition(Math.max(0, Math.min(maxScroll, newPosition)));
    };

    const handleMouseUp = () => {
      setIsDraggingScrollbar(false);
    };

    const chartElement = chartContainerRef.current;
    
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    if (chartElement) {
      chartElement.addEventListener('wheel', handleWheelEvent, { passive: false });
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (chartElement) {
        chartElement.removeEventListener('wheel', handleWheelEvent);
      }
    };
  }, [chartScrollPosition, chartZoom, isDraggingScrollbar]);


  // Sort categories data
  const sortedCategories = [...sampleData.categories].sort((a, b) => {
    let aValue: any, bValue: any;
    
    if (sortBy === "name") {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    } else if (sortBy === "turnover") {
      aValue = a.turnover;
      bValue = b.turnover;
    } else if (sortBy === "increase") {
      aValue = a.increase;
      bValue = b.increase;
    } else if (sortBy === "quantitySold") {
      aValue = a.quantitySold;
      bValue = b.quantitySold;
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Export categories modal data
  const handleCategoriesExport = () => {
    const filename = `product_categories_${timeframe}_${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === "excel") {
      generateExcelFile(sortedCategories, filename, "product_categories");
    } else {
      const docContent = generateDOC(sortedCategories, "product_categories");
      downloadFile(docContent, `${filename}.doc`, 'application/msword');
    }
  };

  // Show loading state
  if (loading) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage="reports" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Reports" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading reports data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (apiError) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar currentPage="reports" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Reports" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Reports</h2>
              <p className="text-gray-600 mb-4">{apiError}</p>
              <button 
                onClick={fetchReportsData}
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

  // Show no data state
  if (!loading && !apiError && sampleData.categories.length === 0 && sampleData.products.length === 0 && sampleData.customers.length === 0 && sampleData.inventory.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar currentPage="reports" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Reports" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
              <p className="text-gray-600 mb-4">No reports data found for the selected timeframe.</p>
              <button 
                onClick={fetchReportsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage="reports" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reports" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <Breadcrumb items={[{ label: "Reports" }]} />
        
        <main className="flex-1 overflow-y-auto px-5 pt-7">
          {/* Top Header Bar with Search - Exact from image */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products, brands, customers"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeframe and Export Controls */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Reports Dashboard</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Timeframe:</span>
                <select 
                  value={timeframe} 
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Export Format:</span>
                <select 
                  value={exportFormat} 
                  onChange={(e) => setExportFormat(e.target.value as "excel" | "doc")}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="excel">Excel</option>
                  <option value="doc">DOC</option>
                </select>
              </div>
              
              {selectedReports.length > 0 && (
                <button
                  onClick={handleBulkExport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  Export Selected ({selectedReports.length})
                </button>
              )}
                <Link
                  href="/reports/outsourced"
                  className="px-4 py-2 rounded-md border border-[#02016a] text-sm font-medium text-[#02016a] hover:bg-[#f5f6ff] transition-colors"
                >
                  Outsourced Analytics
                </Link>
            </div>
          </div>

          {/* ROW 1: Overview (Left) + Best Selling Category (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Overview Section - Top Left */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes("overview")}
                    onChange={() => toggleReportSelection("overview")}
                    className="rounded"
                  />
                  <button
                    onClick={() => handleExport("overview")}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
              
              {/* Exact layout from image - 7 metrics in specific arrangement */}
              <div className="grid grid-cols-2 gap-4">
                {/* Top Row - 3 metrics */}
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-black">₦{overviewData.totalProfit.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Profit</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">₦{overviewData.revenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Revenue</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">₦{overviewData.sales.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Sales</div>
                </div>
                {/* Bottom Row - 4 metrics */}
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-black">₦{overviewData.netPurchaseValue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Net purchase value</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-black">₦{overviewData.netSalesValue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Net sales value</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-black">₦{overviewData.momProfit.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">MoM Profit</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-black">₦{overviewData.yoyProfit.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">YoY Profit</div>
                </div>
              </div>
            </div>

            {/* Best Selling Category - Top Right */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-800">Best selling products</h3>
                  <button 
                    onClick={() => setShowCategoriesModal(true)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    See All
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes("categories")}
                    onChange={() => toggleReportSelection("categories")}
                    className="rounded"
                  />
                  <button
                    onClick={() => handleExport("categories")}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Turn Over</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Increase By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.categories.map((category, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800">{category.name}</td>
                        <td className="py-3 px-4 text-gray-800">₦{category.turnover.toLocaleString()}</td>
                        <td className="py-3 px-4 text-green-600">{category.increase}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ROW 2: Profit & Revenue - Full Width with Chart */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-800">Profit & Revenue</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleChartZoom('daily')}
                      className={`px-2 py-1 text-xs rounded ${chartZoom === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Daily
                    </button>
                    <button 
                      onClick={() => handleChartZoom('monthly')}
                      className={`px-2 py-1 text-xs rounded ${chartZoom === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Monthly
                    </button>
                    <button 
                      onClick={() => handleChartZoom('yearly')}
                      className={`px-2 py-1 text-xs rounded ${chartZoom === 'yearly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Yearly
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleChartScroll('left')}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      disabled={chartScrollPosition === 0}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-500 px-2">
                      {chartScrollPosition + 1}-{Math.min(chartScrollPosition + (chartZoom === 'daily' ? 7 : chartZoom === 'yearly' ? 6 : chartZoom === 'monthly' ? 6 : 12), chartZoom === 'daily' ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : 12)} of {chartZoom === 'daily' ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : 12}
                    </span>
                    <button 
                      onClick={() => handleChartScroll('right')}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      disabled={chartScrollPosition >= (chartZoom === 'daily' ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : 12) - (chartZoom === 'daily' ? 7 : chartZoom === 'yearly' ? 6 : chartZoom === 'monthly' ? 6 : 12)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes("profit_revenue")}
                    onChange={() => toggleReportSelection("profit_revenue")}
                    className="rounded"
                  />
                  <button
                    onClick={() => handleExport("profit_revenue")}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
              
              {/* Chart.js Wavy Curves Chart with Current Month Indicator */}
              <div 
                ref={chartContainerRef}
                className="h-64 w-full relative cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
              >
                <Line data={chartData} options={chartOptions} />
                
                {/* Current Month Vertical Line and Tooltip */}
                {chartData.currentMonthPosition !== -1 && showCurrentMonthTooltip && (
                  <>
                    {/* Vertical Line */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-blue-500 opacity-60"
                      style={{
                        left: `${((chartData.currentMonthPosition + 0.5) / chartData.labels.length) * 100}%`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    
                    {/* Quote-like Tooltip */}
                    <div 
                      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] z-10"
                      style={{
                        left: `${((chartData.currentMonthPosition + 0.5) / chartData.labels.length) * 100}%`,
                        top: '20px',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="text-xs text-gray-500 mb-1">This {chartZoom === 'daily' ? 'Day' : chartZoom === 'yearly' ? 'Year' : 'Month'}</div>
                      <div className="text-sm font-semibold text-gray-800 mb-2">{chartData.currentMonthData.label}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Revenue: ₦{chartData.currentMonthData.revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#F3E5AB'}}></div>
                          <span className="text-sm text-gray-600">Profit: ₦{chartData.currentMonthData.profit.toLocaleString()}</span>
                        </div>
                      </div>
                      {/* Close button */}
                      <button 
                        onClick={() => setShowCurrentMonthTooltip(false)}
                        className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
                
                {/* Show Current Month Button */}
                {!showCurrentMonthTooltip && (
                  <button 
                    onClick={() => setShowCurrentMonthTooltip(true)}
                    className="absolute top-2 right-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded hover:bg-blue-200 transition-colors"
                  >
                    Show Current {chartZoom === 'daily' ? 'Day' : chartZoom === 'yearly' ? 'Year' : 'Month'}
                  </button>
                )}
                
                {/* Scroll Hint */}
                {(chartZoom === 'daily' || chartZoom === 'yearly' || chartZoom === 'monthly') && (
                  <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
                    Scroll to navigate
                  </div>
                )}
                
                {/* Custom Scroll Bar */}
                {(chartZoom === 'daily' || chartZoom === 'yearly' || chartZoom === 'monthly') && (() => {
                  const itemsPerView = chartZoom === 'daily' ? 7 : chartZoom === 'yearly' ? 6 : chartZoom === 'monthly' ? 6 : 12;
                  const totalItems = chartZoom === 'daily' ? 
                    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : 12;
                  const maxScroll = Math.max(0, totalItems - itemsPerView);
                  
                  if (maxScroll <= 0) return null;
                  
                  const scrollBarWidth = 200; // Fixed width for scroll bar
                  const thumbWidth = (itemsPerView / totalItems) * scrollBarWidth;
                  const thumbPosition = (chartScrollPosition / maxScroll) * (scrollBarWidth - thumbWidth);
                  
                  return (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                      <div 
                        className="relative bg-gray-200 rounded-full h-2 cursor-pointer"
                        style={{ width: scrollBarWidth }}
                        data-scrollbar-track
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const newPosition = Math.round((clickX / scrollBarWidth) * maxScroll);
                          setChartScrollPosition(Math.max(0, Math.min(maxScroll, newPosition)));
                        }}
                      >
                        <div 
                          className="absolute top-0 bg-blue-500 rounded-full h-2 transition-all duration-200 hover:bg-blue-600 cursor-grab active:cursor-grabbing"
                          style={{ 
                            width: thumbWidth, 
                            left: thumbPosition 
                          }}
                          onMouseDown={(e) => {
                            setIsDraggingScrollbar(true);
                            e.preventDefault();
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ROW 3: Best Selling Product - Full Width Table */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-800">Best selling products</h3>
                  <button 
                    onClick={() => setShowProductsModal(true)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    See All
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes("products")}
                    onChange={() => toggleReportSelection("products")}
                    className="rounded"
                  />
                  <button
                    onClick={() => handleExport("products")}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Dosage Size</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Product ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Stock Quantity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Turn Over</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Increase By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.products.map((product, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800">{product.name}</td>
                        <td className="py-3 px-4 text-gray-800">
                          {product.productSize && product.productSizeUnit 
                            ? `${product.productSize} ${product.productSizeUnit}`
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-800">{product.id}</td>
                        <td className="py-3 px-4 text-gray-800">{product.category}</td>
                        <td className="py-3 px-4 text-gray-800">{product.quantity}</td>
                        <td className="py-3 px-4 text-gray-800">₦{product.turnover.toLocaleString()}</td>
                        <td className="py-3 px-4 text-green-600">{product.increase}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ROW 4: Customer Analytics - Additional Report */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Customer Analytics</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes("customers")}
                    onChange={() => toggleReportSelection("customers")}
                    className="rounded"
                  />
                  <button
                    onClick={() => handleExport("customers")}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Customer Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Orders</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Total Spent</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Last Order</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.customers.map((customer, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800">{customer.name}</td>
                        <td className="py-3 px-4 text-gray-800">{customer.orders}</td>
                        <td className="py-3 px-4 text-gray-800">₦{customer.totalSpent.toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-800">{customer.lastOrder}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            customer.status === 'VIP' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {customer.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ROW 5: All Sales Transactions Report */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-800">All Sales Transactions</h3>
                  <button 
                    onClick={() => setShowSalesTransactionsModal(true)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    See All
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes("sales_transactions")}
                    onChange={() => toggleReportSelection("sales_transactions")}
                    className="rounded"
                  />
                  <button
                    onClick={() => handleExport("sales_transactions")}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>View all sales transactions for the selected timeframe. Click "See All" to view the complete list.</p>
              </div>
            </div>
          </div>

          {/* ROW 6: All Orders Report */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-800">All Orders</h3>
                  <button 
                    onClick={() => setShowOrdersModal(true)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    See All
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes("orders")}
                    onChange={() => toggleReportSelection("orders")}
                    className="rounded"
                  />
                  <button
                    onClick={() => handleExport("orders")}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>View all orders for the selected timeframe. Click "See All" to view the complete list.</p>
              </div>
            </div>
          </div>

          {/* ROW 7: Inventory Reports - Additional Report */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Inventory Reports</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes("inventory")}
                    onChange={() => toggleReportSelection("inventory")}
                    className="rounded"
                  />
                  <button
                    onClick={() => handleExport("inventory")}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Current Stock</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Min Stock</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Max Stock</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Reorder</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.inventory.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800">{item.product}</td>
                        <td className="py-3 px-4 text-gray-800">{item.currentStock}</td>
                        <td className="py-3 px-4 text-gray-800">{item.minStock}</td>
                        <td className="py-3 px-4 text-gray-800">{item.maxStock}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'Good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.reorder === 'Yes' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.reorder}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-800">{item.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Products Modal */}
          {showProductsModal && (
            <div className="fixed inset-0 flex items-start justify-center pt-20 z-50 bg-black bg-opacity-50" onClick={() => setShowProductsModal(false)}>
              <div className="bg-white rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[90%] max-w-6xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">All Products</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleExport("products")}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => setShowProductsModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Dosage Size</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Product ID</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Stock Quantity</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Turn Over</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Increase By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sampleData.products.map((product, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-800">{product.name}</td>
                            <td className="py-3 px-4 text-gray-800">
                              {product.productSize && product.productSizeUnit 
                                ? `${product.productSize} ${product.productSizeUnit}`
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-gray-800">{product.id}</td>
                            <td className="py-3 px-4 text-gray-800">{product.category}</td>
                            <td className="py-3 px-4 text-gray-800">{product.quantity}</td>
                            <td className="py-3 px-4 text-gray-800">₦{product.turnover.toLocaleString()}</td>
                            <td className="py-3 px-4 text-green-600">{product.increase}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categories Modal */}
          {showCategoriesModal && (
            <div className="fixed inset-0 flex items-start justify-center pt-20 z-50 bg-black bg-opacity-50" onClick={() => setShowCategoriesModal(false)}>
              <div className="bg-white rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[800px] max-h-[600px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">All Product Categories</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Sort by:</span>
                      <select 
                        value={sortBy} 
                          onChange={(e) => setSortBy(e.target.value as "name" | "turnover" | "increase" | "quantitySold")}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="name">Category Name</option>
                        <option value="turnover">Turnover</option>
                        <option value="increase">Increase %</option>
                        <option value="quantitySold">Quantity Sold</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Order:</span>
                      <select 
                        value={sortOrder} 
                        onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                      </select>
                    </div>
                    <button
                      onClick={handleCategoriesExport}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => setShowCategoriesModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[450px]">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Brand</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Turn Over</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Quantity Sold</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Increase By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCategories.map((category, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-800">{category.name}</td>
                            <td className="py-3 px-4 text-gray-800">{category.brand}</td>
                            <td className="py-3 px-4 text-gray-800">₦{category.turnover.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-800">{category.quantitySold} units</td>
                            <td className="py-3 px-4 text-green-600">{category.increase}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Sales Transactions Modal */}
          {showSalesTransactionsModal && (
            <div className="fixed inset-0 flex items-start justify-center pt-20 z-50 bg-black bg-opacity-50" onClick={() => setShowSalesTransactionsModal(false)}>
              <div className="bg-white rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[90%] max-w-6xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">All Sales Transactions</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleExport("sales_transactions")}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => setShowSalesTransactionsModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                  {loadingSalesTransactions ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-gray-500">Loading sales transactions...</div>
                    </div>
                  ) : salesTransactions.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-gray-500">No sales transactions found for the selected timeframe.</div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Transaction ID</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Total Amount</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Payment Method</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesTransactions.map((transaction, index) => (
                            <tr key={transaction.id || transaction.saleId || index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-800">{transaction.id || transaction.saleId || 'N/A'}</td>
                              <td className="py-3 px-4 text-gray-800">{transaction.customerName || transaction.customer?.name || 'N/A'}</td>
                              <td className="py-3 px-4 text-gray-800">
                                {transaction.createdAt 
                                  ? new Date(transaction.createdAt).toLocaleDateString()
                                  : transaction.date || 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  transaction.status === 'COMPLETED' || transaction.status === 'APPROVED' 
                                    ? 'bg-green-100 text-green-800' 
                                    : transaction.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {transaction.status || 'N/A'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-800">₦{(transaction.totalAmount || transaction.total || 0).toLocaleString()}</td>
                              <td className="py-3 px-4 text-gray-800">{transaction.paymentMethod || transaction.payment?.method || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* All Orders Modal */}
          {showOrdersModal && (
            <div className="fixed inset-0 flex items-start justify-center pt-20 z-50 bg-black bg-opacity-50" onClick={() => setShowOrdersModal(false)}>
              <div className="bg-white rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[90%] max-w-6xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">All Orders</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleExport("orders")}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => setShowOrdersModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-gray-500">Loading orders...</div>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-gray-500">No orders found for the selected timeframe.</div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Order ID</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Total Amount</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Items</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order, index) => (
                            <tr key={order.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-800">{order.id || order.orderId || 'N/A'}</td>
                              <td className="py-3 px-4 text-gray-800">{order.customerName || order.customer?.name || 'N/A'}</td>
                              <td className="py-3 px-4 text-gray-800">
                                {order.createdAt 
                                  ? new Date(order.createdAt).toLocaleDateString()
                                  : order.date || 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  order.status === 'COMPLETED' || order.status === 'APPROVED' 
                                    ? 'bg-green-100 text-green-800' 
                                    : order.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status || 'N/A'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-800">₦{(order.totalAmount || order.total || 0).toLocaleString()}</td>
                              <td className="py-3 px-4 text-gray-800">{order.items?.length || order.itemCount || 0} items</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
