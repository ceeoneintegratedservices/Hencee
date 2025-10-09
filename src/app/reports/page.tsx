"use client";

import { useState, useEffect, useRef } from "react";
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
import { getSalesReport, getFinanceReport } from "@/services/reports";
import { listCustomers } from "@/services/customers";
import { getInventoryProducts } from "@/services/inventory";
import { listProducts } from "@/services/products";

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

// Sample data for tyre business
const generateSampleData = (timeframe: string) => {
  // Generate timeframe-specific multipliers
  const getTimeframeMultiplier = (timeframe: string) => {
    switch (timeframe) {
      case 'daily': return 0.14; // 1/7th of weekly
      case 'weekly': return 1;
      case 'monthly': return 4.3; // ~4.3 weeks per month
      case 'yearly': return 52; // 52 weeks per year
      default: return 1;
    }
  };

  const multiplier = getTimeframeMultiplier(timeframe);
  const categories = [
    { name: "GL601 Tyres", turnover: Math.round(26000 * multiplier), increase: 3.2, brand: "Michelin", quantitySold: Math.round(450 * multiplier) },
    { name: "GL602 Tyres", turnover: Math.round(22000 * multiplier), increase: 2.0, brand: "Bridgestone", quantitySold: Math.round(320 * multiplier) },
    { name: "GL908 Tyres", turnover: Math.round(22000 * multiplier), increase: 1.5, brand: "Goodyear", quantitySold: Math.round(280 * multiplier) },
    { name: "DW703tx Tyres", turnover: Math.round(18000 * multiplier), increase: 2.8, brand: "Continental", quantitySold: Math.round(520 * multiplier) }
  ];

  const products = [
    { name: "Michelin GL601", id: "23567", category: "GL601", quantity: `${Math.round(225 * multiplier)} units`, turnover: Math.round(17000 * multiplier), increase: 2.3 },
    { name: "Bridgestone GL602", id: "25831", category: "GL602", quantity: `${Math.round(200 * multiplier)} units`, turnover: Math.round(12000 * multiplier), increase: 1.3 },
    { name: "Goodyear GL908", id: "56841", category: "GL908", quantity: `${Math.round(200 * multiplier)} units`, turnover: Math.round(10000 * multiplier), increase: 1.3 },
    { name: "Continental DW703tx", id: "23567", category: "DW703tx", quantity: `${Math.round(125 * multiplier)} units`, turnover: Math.round(9000 * multiplier), increase: 1.0 }
  ];

  const customers = [
    { name: "John Smith", orders: Math.round(15 * multiplier), totalSpent: Math.round(45000 * multiplier), lastOrder: "2024-01-15", status: "Active" },
    { name: "Sarah Johnson", orders: Math.round(12 * multiplier), totalSpent: Math.round(38000 * multiplier), lastOrder: "2024-01-14", status: "Active" },
    { name: "Mike Wilson", orders: Math.round(8 * multiplier), totalSpent: Math.round(25000 * multiplier), lastOrder: "2024-01-13", status: "Active" },
    { name: "Emily Davis", orders: Math.round(20 * multiplier), totalSpent: Math.round(62000 * multiplier), lastOrder: "2024-01-12", status: "VIP" }
  ];

  const inventory = [
    { product: "Michelin Primacy 4", currentStock: Math.round(225 * multiplier), minStock: 50, maxStock: 500, status: "Good", reorder: "No", supplier: "Michelin Nigeria" },
    { product: "Bridgestone Ecopia", currentStock: Math.round(200 * multiplier), minStock: 30, maxStock: 400, status: "Good", reorder: "No", supplier: "Bridgestone West Africa" },
    { product: "Goodyear Wrangler", currentStock: Math.round(200 * multiplier), minStock: 100, maxStock: 300, status: "Good", reorder: "No", supplier: "Goodyear Nigeria" },
    { product: "Continental ContiTrac", currentStock: Math.round(125 * multiplier), minStock: 50, maxStock: 200, status: "Low", reorder: "Yes", supplier: "Continental Tyres" }
  ];

  return { categories, products, customers, inventory };
};

export default function ReportsPage() {
  const { showError, showSuccess } = useNotifications();
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [timeframe, setTimeframe] = useState("weekly");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<"excel" | "doc">("excel");
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "turnover" | "increase" | "quantitySold">("turnover");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [chartZoom, setChartZoom] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [chartScrollPosition, setChartScrollPosition] = useState(0);
  const [showCurrentMonthTooltip, setShowCurrentMonthTooltip] = useState(true);
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // API State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState({
    salesReport: null as any,
    financeReport: null as any,
    customers: [] as any[],
    inventory: [] as any[],
    products: [] as any[]
  });
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    } else {
      window.location.href = '/login';
    }
    setLoading(false);
  }, []);

  // Fetch API data
  const fetchReportsData = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setApiError(null);
    
    try {
      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'daily':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'yearly':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const dateParams = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        groupBy: (timeframe === 'daily' ? 'day' : timeframe === 'weekly' ? 'week' : timeframe === 'monthly' ? 'month' : 'year') as 'day' | 'week' | 'month' | 'year'
      };

      // Fetch data from multiple APIs
      const [salesReport, financeReport, customers, inventory, products] = await Promise.allSettled([
        getSalesReport(dateParams).catch(() => null),
        getFinanceReport(dateParams).catch(() => null),
        listCustomers().catch(() => []),
        getInventoryProducts().catch(() => []),
        listProducts().catch(() => [])
      ]);

      setApiData({
        salesReport: salesReport.status === 'fulfilled' ? salesReport.value : null,
        financeReport: financeReport.status === 'fulfilled' ? financeReport.value : null,
        customers: customers.status === 'fulfilled' ? customers.value : [],
        inventory: inventory.status === 'fulfilled' ? inventory.value : [],
        products: products.status === 'fulfilled' ? products.value : []
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

  // Generate data from API or fallback to sample data
  const getReportsData = () => {
    if (loading || apiError) {
      return generateSampleData(timeframe);
    }

    // Use API data to generate reports
    const { salesReport, financeReport, customers, inventory, products } = apiData;
    
    // Ensure we have arrays to work with
    const safeProducts = Array.isArray(products) ? products : [];
    const safeCustomers = Array.isArray(customers) ? customers : [];
    const safeInventory = Array.isArray(inventory) ? inventory : [];

    // Transform API data to match the expected format
    const categories = safeProducts.slice(0, 4).map((product: any, index: number) => ({
      name: product.name || `Product ${index + 1}`,
      turnover: product.sellingPrice * (product.quantity || 0),
      increase: Math.random() * 5, // Placeholder - would come from historical data
      brand: product.brand || 'Unknown',
      quantitySold: product.quantity || 0
    }));

    const transformedProducts = safeProducts.slice(0, 4).map((product: any) => ({
      name: product.name || 'Unknown Product',
      id: product.id || 'N/A',
      category: product.category?.name || 'General',
      quantity: `${product.quantity || 0} units`,
      turnover: product.sellingPrice * (product.quantity || 0),
      increase: Math.random() * 3 // Placeholder
    }));

    const transformedCustomers = safeCustomers.slice(0, 4).map((customer: any) => ({
      name: customer.name || 'Unknown Customer',
      orders: customer.orders || 0,
      totalSpent: customer.orderTotal || 0,
      lastOrder: customer.updatedAt ? new Date(customer.updatedAt).toISOString().split('T')[0] : 'N/A',
      status: customer.status || 'Active'
    }));

    const transformedInventory = safeInventory.slice(0, 4).map((item: any) => ({
      product: item.name || 'Unknown Product',
      currentStock: item.quantity || 0,
      minStock: item.reorderPoint || 10,
      maxStock: (item.quantity || 0) * 2,
      status: (item.quantity || 0) > (item.reorderPoint || 10) ? 'Good' : 'Low',
      reorder: (item.quantity || 0) <= (item.reorderPoint || 10) ? 'Yes' : 'No',
      supplier: 'Unknown Supplier'
    }));

    return {
      categories,
      products: transformedProducts,
      customers: transformedCustomers,
      inventory: transformedInventory
    };
  };

  const sampleData = getReportsData();

  // Overview metrics - timeframe specific
  const getTimeframeMultiplier = (timeframe: string) => {
    switch (timeframe) {
      case 'daily': return 0.14;
      case 'weekly': return 1;
      case 'monthly': return 4.3;
      case 'yearly': return 52;
      default: return 1;
    }
  };

  const multiplier = getTimeframeMultiplier(timeframe);
  
  // Generate chart data for wavy curves based on timeframe with scrolling
  const generateChartData = () => {
    let allLabels: string[] = [];
    const allRevenueData: number[] = [];
    const allProfitData: number[] = [];
    
    if (chartZoom === 'daily') {
      // For daily view, show current month with daily data
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      // Generate labels for days of current month
      allLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
      
      // Generate daily data with wavy patterns
      for (let day = 1; day <= daysInMonth; day++) {
        // Create wavy patterns with daily variations
        const dayProgress = (day - 1) / (daysInMonth - 1); // 0 to 1
        const revenue = 30000 + (Math.sin(dayProgress * Math.PI * 2) * 15000) + (Math.sin(dayProgress * Math.PI * 4) * 8000) + (Math.sin(dayProgress * Math.PI * 8) * 3000);
        const profit = 20000 + (Math.sin(dayProgress * Math.PI * 1.5) * 12000) + (Math.sin(dayProgress * Math.PI * 3) * 6000) + (Math.sin(dayProgress * Math.PI * 6) * 2000);
        
        allRevenueData.push(Math.round(revenue * multiplier));
        allProfitData.push(Math.round(profit * multiplier));
      }
    } else if (chartZoom === 'monthly') {
      // For monthly view, show Jan to Dec
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      allLabels = months;
      
      for (let i = 0; i < 12; i++) {
        // Create wavy patterns with multiple sine waves for organic curves
        const revenue = 30000 + (Math.sin(i * 0.8) * 20000) + (Math.sin(i * 0.3) * 10000) + (Math.sin(i * 0.1) * 5000);
        const profit = 20000 + (Math.sin(i * 0.6) * 15000) + (Math.sin(i * 0.4) * 8000) + (Math.sin(i * 0.2) * 3000);
        
        allRevenueData.push(Math.round(revenue * multiplier));
        allProfitData.push(Math.round(profit * multiplier));
      }
    } else if (chartZoom === 'yearly') {
      // For yearly view, show years from 2025 onwards (increasing)
      const years = [];
      for (let year = 2025; year <= 2036; year++) {
        years.push(year.toString());
      }
      allLabels = years;
      
      for (let i = 0; i < 12; i++) {
        // Create wavy patterns for yearly data
        const revenue = 30000 + (Math.sin(i * 0.5) * 25000) + (Math.sin(i * 0.2) * 12000) + (Math.sin(i * 0.1) * 6000);
        const profit = 20000 + (Math.sin(i * 0.4) * 18000) + (Math.sin(i * 0.15) * 9000) + (Math.sin(i * 0.08) * 4000);
        
        allRevenueData.push(Math.round(revenue * multiplier));
        allProfitData.push(Math.round(profit * multiplier));
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
  
  const overviewData = {
    totalProfit: Math.round(21190 * multiplier),
    revenue: Math.round(18300 * multiplier),
    sales: Math.round(17432 * multiplier),
    netPurchaseValue: Math.round(117432 * multiplier),
    netSalesValue: Math.round(80432 * multiplier),
    momProfit: Math.round(30432 * multiplier),
    yoyProfit: Math.round(110432 * multiplier)
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
    const filename = `tyre_categories_${timeframe}_${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === "excel") {
      generateExcelFile(sortedCategories, filename, "tyre_categories");
    } else {
      const docContent = generateDOC(sortedCategories, "tyre_categories");
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
                      placeholder="Search tyres, brands, customers"
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
                  <h3 className="text-lg font-semibold text-gray-800">Best selling tyre categories</h3>
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
                  <h3 className="text-lg font-semibold text-gray-800">Best selling tyres</h3>
                  <a href="#" className="text-blue-600 text-sm hover:underline">See All</a>
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
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Tyre Model</th>
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

          {/* ROW 5: Inventory Reports - Additional Report */}
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
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Tyre Model</th>
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

          {/* Categories Modal */}
          {showCategoriesModal && (
            <div className="absolute inset-0 flex items-start justify-center pt-20 z-50" onClick={() => setShowCategoriesModal(false)}>
              <div className="bg-white rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[800px] max-h-[600px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">All Tyre Categories</h2>
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
        </main>
      </div>
    </div>
  );
}
