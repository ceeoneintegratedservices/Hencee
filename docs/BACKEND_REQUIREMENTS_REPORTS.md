# Backend Requirements for Reports Page

This document outlines what the backend needs to provide for the reports page to display real data instead of dummy/calculated values.

## Current Status

The frontend has been updated to use real backend data where available. The following sections detail what the backend should provide.

---

## 1. Financial Report Endpoint (`GET /api/ceeone/reports/financial`)

### Current Usage
The frontend uses this endpoint to get:
- Total Profit
- Total Revenue
- Total Expenses (for Net Purchase Value)
- MoM (Month-over-Month) Profit
- YoY (Year-over-Year) Profit
- Chart data (profit trends over time)

### Required Response Structure

```typescript
{
  data: FinanceReportItem[];  // Time-series data for charts
  summary: {
    totalRevenue: number;      // ✅ Currently used
    totalExpenses: number;      // ✅ Currently used
    totalProfit: number;        // ✅ Currently used
    profitMargin: number;
    momProfit?: number;         // ⚠️ OPTIONAL: If provided, frontend will use it
    yoyProfit?: number;         // ⚠️ OPTIONAL: If provided, frontend will use it
    paymentMethods: Array<{
      method: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
  };
}
```

### What Frontend Does
- ✅ Uses `summary.totalRevenue`, `summary.totalProfit`, `summary.totalExpenses`
- ✅ Calculates MoM profit by comparing current period with previous period from `data` array
- ✅ Calculates YoY profit by comparing current period with same period last year from `data` array
- ⚠️ If `summary.momProfit` and `summary.yoyProfit` are provided, frontend will use those instead

### Backend Recommendations
1. **Add MoM and YoY to summary** (Optional but recommended):
   ```typescript
   summary: {
     // ... existing fields
     momProfit: number;  // Current month profit - Previous month profit
     yoyProfit: number;  // Current period profit - Same period last year profit
   }
   ```
   This will make the frontend more efficient and accurate.

2. **Ensure `data` array is sorted by period** (chronologically):
   - Frontend uses the first item as "current period"
   - Frontend compares with second item for MoM
   - Frontend searches for matching period from last year for YoY

---

## 2. Sales Report Endpoint (`GET /api/ceeone/reports/sales`)

### Current Usage
The frontend uses this endpoint to get:
- Best selling products (from `summary.topProducts`)
- Category sales data (from `data` array with products grouped by category)
- Revenue/Sales totals
- Chart data (revenue trends over time)

### Required Response Structure

```typescript
{
  data: SalesReportItem[];  // Time-series data with products per period
  summary: {
    totalSales: number;      // ✅ Currently used
    totalOrders: number;
    averageOrderValue: number;
    topProducts: Array<{     // ✅ Currently used for "Best Selling Products"
      id: string;
      name: string;
      totalSold: number;     // Quantity sold
      revenue: number;       // Total revenue from this product
      productSize?: string;  // ✅ Already included
      productSizeUnit?: string; // ✅ Already included
      packSize?: string;      // ✅ Already included
      category?: {            // ⚠️ RECOMMENDED: Add category info
        id: string;
        name: string;
      };
      categoryName?: string; // Alternative: just category name
      cost?: number;         // ⚠️ OPTIONAL: For profit margin calculation
    }>;
    topCategories?: Array<{  // ⚠️ NEW: Recommended for category sales
      id: string;
      name: string;
      totalRevenue: number;
      totalQuantity: number;
      productCount: number;
    }>;
  };
}
```

### What Frontend Does
- ✅ Uses `summary.topProducts` for "Best Selling Products" table
- ✅ Extracts category data from `data[].products[]` array (if available)
- ⚠️ Falls back to calculating from product list if sales data not available

### Backend Recommendations
1. **Add category information to `topProducts`**:
   ```typescript
   topProducts: [{
     // ... existing fields
     category: { id: string, name: string },
     // OR
     categoryName: string,
   }]
   ```

2. **Add `topCategories` to summary** (Optional but recommended):
   ```typescript
   summary: {
     // ... existing fields
     topCategories: [
       {
         id: string;
         name: string;
         totalRevenue: number;
         totalQuantity: number;
         productCount: number;
       }
     ]
   }
   ```
   This will allow frontend to show accurate category sales data.

3. **Include products in `data` array with category info**:
   ```typescript
   data: [{
     period: string;
     totalSales: number;
     products: [{
       id: string;
       name: string;
       revenue: number;
       totalSold: number;
       category: { id: string, name: string }; // ⚠️ Add this
       // OR
       categoryName: string; // Alternative
     }];
   }]
   ```

---

## 3. Query Parameters

Both endpoints should support the following query parameters:

```typescript
{
  dateRange?: string;  // 'today', 'yesterday', 'this_week', 'last_week', 
                       // 'this_month', 'last_month', 'this_quarter', 
                       // 'last_quarter', 'this_year', 'last_year', 'custom'
  startDate?: string;  // YYYY-MM-DD (required if dateRange='custom')
  endDate?: string;    // YYYY-MM-DD (required if dateRange='custom')
  groupBy?: string;    // 'day', 'week', 'month', 'year'
}
```

---

## 4. Summary of Backend Changes Needed

### High Priority (Frontend will work but less accurate without these)

1. **Financial Report**:
   - ✅ Already provides: `totalRevenue`, `totalProfit`, `totalExpenses`
   - ⚠️ **Recommended**: Add `momProfit` and `yoyProfit` to `summary`
   - ✅ Already provides: `data` array with time-series profit data

2. **Sales Report**:
   - ✅ Already provides: `summary.topProducts` with dosage fields
   - ⚠️ **Recommended**: Add `category` or `categoryName` to each product in `topProducts`
   - ⚠️ **Recommended**: Add `topCategories` array to `summary`
   - ⚠️ **Recommended**: Include `category` info in `data[].products[]` array

### Low Priority (Nice to have)

1. Add `cost` field to `topProducts` for accurate profit margin calculation
2. Add `topCategories` summary for faster category data loading
3. Ensure data arrays are sorted chronologically (newest first or oldest first, consistently)

---

## 5. Testing Checklist

After implementing backend changes, verify:

- [ ] Financial report returns `summary.totalRevenue`, `summary.totalProfit`, `summary.totalExpenses`
- [ ] Financial report `data` array contains time-series profit data
- [ ] Sales report returns `summary.topProducts` with at least 4 products
- [ ] `topProducts` includes `productSize` and `productSizeUnit` (already done ✅)
- [ ] `topProducts` includes category information (NEW)
- [ ] Sales report `data` array includes products with category info (NEW)
- [ ] MoM and YoY profit calculations work (frontend calculates, but backend can provide)

---

## 6. Example Response Structures

### Financial Report Example
```json
{
  "data": [
    {
      "period": "2025-01",
      "revenue": 150000,
      "expenses": 100000,
      "profit": 50000
    },
    {
      "period": "2024-12",
      "revenue": 140000,
      "expenses": 95000,
      "profit": 45000
    }
  ],
  "summary": {
    "totalRevenue": 150000,
    "totalExpenses": 100000,
    "totalProfit": 50000,
    "profitMargin": 33.33,
    "momProfit": 5000,  // 50000 - 45000 (optional)
    "yoyProfit": 10000  // vs same month last year (optional)
  }
}
```

### Sales Report Example (with category info)
```json
{
  "data": [
    {
      "period": "2025-01",
      "totalSales": 150000,
      "products": [
        {
          "id": "prod-123",
          "name": "Product A",
          "revenue": 50000,
          "totalSold": 100,
          "category": { "id": "cat-1", "name": "Tablets" }
        }
      ]
    }
  ],
  "summary": {
    "totalSales": 150000,
    "topProducts": [
      {
        "id": "prod-123",
        "name": "Product A",
        "totalSold": 100,
        "revenue": 50000,
        "productSize": "500mg",
        "productSizeUnit": "mg",
        "category": { "id": "cat-1", "name": "Tablets" }
      }
    ],
    "topCategories": [
      {
        "id": "cat-1",
        "name": "Tablets",
        "totalRevenue": 50000,
        "totalQuantity": 100,
        "productCount": 5
      }
    ]
  }
}
```

---

## Notes

- The frontend has fallback logic, so it will work even if some fields are missing
- However, accuracy improves significantly when backend provides the recommended fields
- All changes are backward compatible - existing responses will still work
- Frontend calculates MoM/YoY from data array if summary fields not provided

