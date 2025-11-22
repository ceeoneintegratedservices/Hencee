// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Pharma App (CeeOne) API prefix
const CEEONE_PREFIX = '/api/ceeone';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints (Pharma/CeeOne)
  register: `${API_BASE_URL}${CEEONE_PREFIX}/auth/register`,
  login: `${API_BASE_URL}${CEEONE_PREFIX}/auth/login`, // Login endpoint is shared (no prefix)
  verifyEmail: `${API_BASE_URL}${CEEONE_PREFIX}/auth/verify-email`,
  resendVerification: `${API_BASE_URL}${CEEONE_PREFIX}/auth/resend-verification`,
  forgotPassword: `${API_BASE_URL}${CEEONE_PREFIX}/auth/password/forgot`,
  resetPassword: `${API_BASE_URL}${CEEONE_PREFIX}/auth/password/reset`,
  passwordReset: `${API_BASE_URL}${CEEONE_PREFIX}/auth/password-reset`,
  passwordResetConfirm: `${API_BASE_URL}${CEEONE_PREFIX}/auth/password-reset/confirm`,
  changePassword: `${API_BASE_URL}${CEEONE_PREFIX}/auth/change-password`,
  refresh: `${API_BASE_URL}${CEEONE_PREFIX}/auth/refresh`,
  // Public endpoints (Pharma/CeeOne)
  roles: `${API_BASE_URL}${CEEONE_PREFIX}/roles`,
  
  // Registration drafts (Pharma/CeeOne - tenant-specific)
  registrationDrafts: `${API_BASE_URL}${CEEONE_PREFIX}/auth/registration-drafts`,
  registrationDraftById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/auth/registration-drafts/${id}`,
  registrationDraftByEmail: (email: string) => `${API_BASE_URL}${CEEONE_PREFIX}/auth/registration-drafts?email=${encodeURIComponent(email)}`,
  registrationDraftSubmit: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/auth/registration-drafts/${id}/submit`,
  
  // User management (Pharma/CeeOne - tenant-specific)
  deactivateUser: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/users/${id}/deactivate`,
  deleteUser: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/users/${id}`,
  
  // Customer endpoints (Pharma/CeeOne)
  customers: `${API_BASE_URL}${CEEONE_PREFIX}/customers`,
  customerById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/customers/${id}`,
  customerSales: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/customers/${id}/sales`,
  customerStats: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/customers/${id}/stats`,
  customerSearch: `${API_BASE_URL}${CEEONE_PREFIX}/customers/search`,
  customerOutstandingBalance: `${API_BASE_URL}${CEEONE_PREFIX}/customers/outstanding/balance`,
  customerTop: `${API_BASE_URL}${CEEONE_PREFIX}/customers/top`,
  customerCreditLimit: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/customers/${id}/credit-limit`,
  
  // Product endpoints (Pharma/CeeOne)
  products: `${API_BASE_URL}${CEEONE_PREFIX}/products`,
  productById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/products/${id}`,
  productSearch: `${API_BASE_URL}${CEEONE_PREFIX}/products/search`,
  productLowStock: `${API_BASE_URL}${CEEONE_PREFIX}/products/low-stock`,
  productStock: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/products/${id}/stock`,
  productCategory: (categoryId: string) => `${API_BASE_URL}${CEEONE_PREFIX}/products/category/${categoryId}`,
  productWarehouse: (warehouseId: string) => `${API_BASE_URL}${CEEONE_PREFIX}/products/warehouse/${warehouseId}`,
  
  // Warehouse endpoints (Pharma/CeeOne)
  warehouses: `${API_BASE_URL}${CEEONE_PREFIX}/warehouses`,
  warehouseById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/warehouses/${id}`,
  
  // Sales endpoints (Pharma/CeeOne)
  sales: `${API_BASE_URL}${CEEONE_PREFIX}/sales`,
  saleById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/sales/${id}`,
  saleStatus: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/sales/${id}/status`,
  salePayments: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/sales/${id}/payments`,
  salesByCustomer: (customerId: string) => `${API_BASE_URL}${CEEONE_PREFIX}/sales/customer/${customerId}`,
  salesDateRange: `${API_BASE_URL}${CEEONE_PREFIX}/sales/date-range`,
  salesPendingPayments: `${API_BASE_URL}${CEEONE_PREFIX}/sales/pending-payments`,
  salesSearch: `${API_BASE_URL}${CEEONE_PREFIX}/sales/search`,
  salesDaily: (date: string) => `${API_BASE_URL}${CEEONE_PREFIX}/sales/daily/${date}`,
  salesMonthlyReport: `${API_BASE_URL}${CEEONE_PREFIX}/sales/monthly-report`,
  salesDashboard: `${API_BASE_URL}${CEEONE_PREFIX}/sales/dashboard`,
  
  // Tire endpoints (Pharma/CeeOne - keeping for backward compatibility)
  tires: `${API_BASE_URL}${CEEONE_PREFIX}/tires`,
  tireById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/tires/id/${id}`,
  tireDrafts: `${API_BASE_URL}${CEEONE_PREFIX}/tires/drafts`,
  tirePublish: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/tires/${id}/publish`,
  tireDraft: `${API_BASE_URL}${CEEONE_PREFIX}/tires/draft`,
  
  // Order endpoints (Pharma/CeeOne) - Note: Orders are typically handled through sales
  orders: `${API_BASE_URL}${CEEONE_PREFIX}/sales`, // Using sales endpoint for orders
  orderById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/sales/${id}`,
  orderStatus: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/sales/${id}/status`,
  
  // Payment endpoints (Pharma/CeeOne)
  payments: `${API_BASE_URL}${CEEONE_PREFIX}/payments`,
  paymentById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/payments/${id}`,
  paymentStatus: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/payments/${id}/status`,
  paymentsBySale: (saleId: string) => `${API_BASE_URL}${CEEONE_PREFIX}/payments/sale/${saleId}`,
  paymentsByMethod: (method: string) => `${API_BASE_URL}${CEEONE_PREFIX}/payments/method/${method}`,
  paymentsByStatus: (status: string) => `${API_BASE_URL}${CEEONE_PREFIX}/payments/status/${status}`,
  paymentsDateRange: `${API_BASE_URL}${CEEONE_PREFIX}/payments/date-range`,
  paymentByReference: (reference: string) => `${API_BASE_URL}${CEEONE_PREFIX}/payments/reference/${reference}`,
  paymentsDaily: (date: string) => `${API_BASE_URL}${CEEONE_PREFIX}/payments/daily/${date}`,
  paymentsPending: `${API_BASE_URL}${CEEONE_PREFIX}/payments/pending`,
  paymentsStats: `${API_BASE_URL}${CEEONE_PREFIX}/payments/stats`,
  paymentRefund: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/payments/${id}/refund`,
  
  // Inventory endpoints (Pharma/CeeOne)
  inventory: `${API_BASE_URL}${CEEONE_PREFIX}/inventory`,
  inventoryById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/inventory/${id}`,
  inventoryAdjustStock: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/inventory/adjust-stock/${id}`,
  inventoryMovements: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/inventory/${id}/movements`,
  inventoryReorderLevel: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/inventory/${id}/reorder-level`,
  inventoryPermissions: `${API_BASE_URL}${CEEONE_PREFIX}/inventory/permissions`,
  
  // Pharma-specific Inventory endpoints
  inventoryExpiring: `${API_BASE_URL}${CEEONE_PREFIX}/inventory/expiring`,
  inventoryExpiringByWarehouse: (warehouseId: string) => `${API_BASE_URL}${CEEONE_PREFIX}/inventory/expiring/warehouse/${warehouseId}`,
  inventoryDamages: `${API_BASE_URL}${CEEONE_PREFIX}/inventory/damages`,
  inventoryDamagesByProduct: (productId: string) => `${API_BASE_URL}${CEEONE_PREFIX}/inventory/damages/product/${productId}`,
  inventoryRecordDamage: (productId: string) => `${API_BASE_URL}${CEEONE_PREFIX}/inventory/damages/product/${productId}`,
  
  // Category endpoints (Pharma/CeeOne)
  categories: `${API_BASE_URL}${CEEONE_PREFIX}/categories`,
  categoryById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/categories/${id}`,
  
  // Approval endpoints (Pharma/CeeOne)
  approvals: `${API_BASE_URL}${CEEONE_PREFIX}/approvals`,
  approvalById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/approvals/${id}`,
  approvalsPending: `${API_BASE_URL}${CEEONE_PREFIX}/approvals/pending`,
  approvalApprove: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/approvals/${id}/approve`,
  approvalReject: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/approvals/${id}/reject`,
  approvalMarkPaid: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/approvals/${id}/mark-paid`,
  // Account approval endpoints
  accountApprovals: `${API_BASE_URL}${CEEONE_PREFIX}/approvals/accounts`,
  accountApprovalsPending: `${API_BASE_URL}${CEEONE_PREFIX}/approvals/accounts/pending`,
  accountApprovalApprove: (userId: string) => `${API_BASE_URL}${CEEONE_PREFIX}/approvals/accounts/${userId}/approve`,
  accountApprovalReject: (userId: string) => `${API_BASE_URL}${CEEONE_PREFIX}/approvals/accounts/${userId}/reject`,
  // Refund approval endpoints
  refundApprovals: `${API_BASE_URL}${CEEONE_PREFIX}/approvals/refunds`,
  refundApprovalsPending: `${API_BASE_URL}${CEEONE_PREFIX}/approvals/refunds/pending`,
  refundApprovalById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/approvals/refunds/${id}`,
  refundApprovalApprove: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/approvals/refunds/${id}/approve`,
  refundApprovalReject: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/approvals/refunds/${id}/reject`,
  refundApprovalMarkProcessed: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/approvals/refunds/${id}/mark-processed`,
  
  // Permission endpoints (Pharma/CeeOne)
  permissionsTest: `${API_BASE_URL}${CEEONE_PREFIX}/permissions/test`,
  permissionsMatrix: `${API_BASE_URL}${CEEONE_PREFIX}/permissions/matrix`,
  permissionsRoles: `${API_BASE_URL}${CEEONE_PREFIX}/permissions/roles`,
  permissionsRoleByType: (roleType: string) => `${API_BASE_URL}${CEEONE_PREFIX}/permissions/roles/${roleType}`,
  permissionsModules: `${API_BASE_URL}${CEEONE_PREFIX}/permissions/modules`,
  permissionsStatistics: `${API_BASE_URL}${CEEONE_PREFIX}/permissions/statistics`,
  permissionsValidate: `${API_BASE_URL}${CEEONE_PREFIX}/permissions/validate`,
  permissionsRecommendRole: `${API_BASE_URL}${CEEONE_PREFIX}/permissions/recommend-role`,
  permissionsUserPermissions: `${API_BASE_URL}${CEEONE_PREFIX}/permissions/user-permissions`,
  permissionsCheckPermission: `${API_BASE_URL}${CEEONE_PREFIX}/permissions/check-permission`,
  permissionsCheckMultiplePermissions: `${API_BASE_URL}${CEEONE_PREFIX}/permissions/check-multiple-permissions`,
  permissionsAvailablePermissions: `${API_BASE_URL}${CEEONE_PREFIX}/permissions/available-permissions`,
  permissionsRoleComparison: `${API_BASE_URL}${CEEONE_PREFIX}/permissions/role-comparison`,
  
  // Compatibility test endpoints (Pharma/CeeOne)
  compatibilityTestStatus: `${API_BASE_URL}${CEEONE_PREFIX}/compatibility-test/status`,
  compatibilityTestOldPermissions: `${API_BASE_URL}${CEEONE_PREFIX}/compatibility-test/test-old-permissions`,
  compatibilityTestPermissionMapping: `${API_BASE_URL}${CEEONE_PREFIX}/compatibility-test/test-permission-mapping`,
  compatibilityTestRoleMapping: `${API_BASE_URL}${CEEONE_PREFIX}/compatibility-test/test-role-mapping`,
  
  // Users endpoints (Pharma/CeeOne)
  users: `${API_BASE_URL}${CEEONE_PREFIX}/users`,
  
  // Audit logs endpoints (Pharma/CeeOne)
  auditLogs: `${API_BASE_URL}${CEEONE_PREFIX}/audit-logs`,
  
  // Reports endpoints (Pharma/CeeOne)
  reports: {
    sales: `${API_BASE_URL}${CEEONE_PREFIX}/reports/sales`,
    inventory: `${API_BASE_URL}${CEEONE_PREFIX}/reports/inventory`,
    customers: `${API_BASE_URL}${CEEONE_PREFIX}/reports/customers`,
    payments: `${API_BASE_URL}${CEEONE_PREFIX}/reports/payments`,
    finance: `${API_BASE_URL}${CEEONE_PREFIX}/reports/finance`,
  },
  
  // Dashboard endpoints (Pharma/CeeOne)
  dashboard: `${API_BASE_URL}${CEEONE_PREFIX}/dashboard`,
  dashboardOverview: `${API_BASE_URL}${CEEONE_PREFIX}/dashboard/overview`,
  dashboardSales: `${API_BASE_URL}${CEEONE_PREFIX}/dashboard/sales`,
  dashboardCustomers: `${API_BASE_URL}${CEEONE_PREFIX}/dashboard/customers`,
  dashboardProducts: `${API_BASE_URL}${CEEONE_PREFIX}/dashboard/products`,
  dashboardOrders: `${API_BASE_URL}${CEEONE_PREFIX}/dashboard/orders`,
  dashboardMarketing: `${API_BASE_URL}${CEEONE_PREFIX}/dashboard/marketing`,
  dashboardActivities: `${API_BASE_URL}${CEEONE_PREFIX}/dashboard/activities`,
  dashboardSummary: `${API_BASE_URL}${CEEONE_PREFIX}/dashboard/summary`,

  // Expenses endpoints (Pharma/CeeOne)
  expenses: `${API_BASE_URL}${CEEONE_PREFIX}/expenses`,

  // Settings endpoints (Pharma/CeeOne)
  settings: `${API_BASE_URL}${CEEONE_PREFIX}/settings`,
  settingsProfile: `${API_BASE_URL}${CEEONE_PREFIX}/settings/profile`,
  settingsPreferences: `${API_BASE_URL}${CEEONE_PREFIX}/settings/preferences`,
  settingsSystem: `${API_BASE_URL}${CEEONE_PREFIX}/settings/system`,
  settingsBusiness: `${API_BASE_URL}${CEEONE_PREFIX}/settings/business`,

  // Session endpoints (Pharma/CeeOne)
  sessions: `${API_BASE_URL}${CEEONE_PREFIX}/sessions`,
  sessionById: (id: string) => `${API_BASE_URL}${CEEONE_PREFIX}/sessions/${id}`,
  sessionsActive: `${API_BASE_URL}${CEEONE_PREFIX}/sessions/active`,
  sessionsStats: `${API_BASE_URL}${CEEONE_PREFIX}/sessions/stats`,
  sessionsOthers: `${API_BASE_URL}${CEEONE_PREFIX}/sessions/others`,

  // API documentation (Pharma/CeeOne)
  apiDocs: `${API_BASE_URL}${CEEONE_PREFIX}/api/docs`,
}; 