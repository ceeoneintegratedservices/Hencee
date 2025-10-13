// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ceeone-api.onrender.com';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  verifyEmail: `${API_BASE_URL}/auth/verify-email`,
  resendVerification: `${API_BASE_URL}/auth/resend-verification`,
  forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
  resetPassword: `${API_BASE_URL}/auth/reset-password`,
  passwordReset: `${API_BASE_URL}/auth/password-reset`,
  passwordResetConfirm: `${API_BASE_URL}/auth/password-reset/confirm`,
  changePassword: `${API_BASE_URL}/auth/change-password`,
  deactivateUser: (id: string) => `${API_BASE_URL}/auth/users/${id}/deactivate`,
  deleteUser: (id: string) => `${API_BASE_URL}/auth/users/${id}`,
  
  // Customer endpoints
  customers: `${API_BASE_URL}/customers`,
  customerById: (id: string) => `${API_BASE_URL}/customers/${id}`,
  customerSales: (id: string) => `${API_BASE_URL}/customers/${id}/sales`,
  customerStats: (id: string) => `${API_BASE_URL}/customers/${id}/stats`,
  customerSearch: `${API_BASE_URL}/customers/search`,
  customerOutstandingBalance: `${API_BASE_URL}/customers/outstanding/balance`,
  customerTop: `${API_BASE_URL}/customers/top`,
  customerCreditLimit: (id: string) => `${API_BASE_URL}/customers/${id}/credit-limit`,
  
  // Product endpoints
  products: `${API_BASE_URL}/products`,
  productById: (id: string) => `${API_BASE_URL}/products/id/${id}`,
  productSearch: `${API_BASE_URL}/products/search`,
  productLowStock: `${API_BASE_URL}/products/low-stock`,
  productStock: (id: string) => `${API_BASE_URL}/products/id/${id}/stock`,
  productCategory: (categoryId: string) => `${API_BASE_URL}/products/category/${categoryId}`,
  productWarehouse: (warehouseId: string) => `${API_BASE_URL}/products/warehouse/${warehouseId}`,
  
  // Warehouse endpoints
  warehouses: `${API_BASE_URL}/warehouses`,
  warehouseById: (id: string) => `${API_BASE_URL}/warehouses/${id}`,
  
  // Sales endpoints
  sales: `${API_BASE_URL}/sales`,
  saleById: (id: string) => `${API_BASE_URL}/sales/id/${id}`,
  saleStatus: (id: string) => `${API_BASE_URL}/sales/${id}/status`,
  salePayments: (id: string) => `${API_BASE_URL}/sales/${id}/payments`,
  salesByCustomer: (customerId: string) => `${API_BASE_URL}/sales/customer/${customerId}`,
  salesDateRange: `${API_BASE_URL}/sales/date-range`,
  salesPendingPayments: `${API_BASE_URL}/sales/pending-payments`,
  salesSearch: `${API_BASE_URL}/sales/search`,
  salesDaily: (date: string) => `${API_BASE_URL}/sales/daily/${date}`,
  salesMonthlyReport: `${API_BASE_URL}/sales/monthly-report`,
  salesDashboard: `${API_BASE_URL}/sales/dashboard`,
  
  // Tire endpoints
  tires: `${API_BASE_URL}/tires`,
  tireById: (id: string) => `${API_BASE_URL}/tires/id/${id}`,
  tireDrafts: `${API_BASE_URL}/tires/drafts`,
  tirePublish: (id: string) => `${API_BASE_URL}/tires/${id}/publish`,
  tireDraft: `${API_BASE_URL}/tires/draft`,
  
  // Order endpoints
  orders: `${API_BASE_URL}/orders`,
  orderById: (id: string) => `${API_BASE_URL}/orders/${id}`,
  orderStatus: (id: string) => `${API_BASE_URL}/orders/${id}/status`,
  
  // Payment endpoints
  payments: `${API_BASE_URL}/payments`,
  paymentById: (id: string) => `${API_BASE_URL}/payments/${id}`,
  paymentStatus: (id: string) => `${API_BASE_URL}/payments/${id}/status`,
  paymentsBySale: (saleId: string) => `${API_BASE_URL}/payments/sale/${saleId}`,
  paymentsByMethod: (method: string) => `${API_BASE_URL}/payments/method/${method}`,
  paymentsByStatus: (status: string) => `${API_BASE_URL}/payments/status/${status}`,
  paymentsDateRange: `${API_BASE_URL}/payments/date-range`,
  paymentByReference: (reference: string) => `${API_BASE_URL}/payments/reference/${reference}`,
  paymentsDaily: (date: string) => `${API_BASE_URL}/payments/daily/${date}`,
  paymentsPending: `${API_BASE_URL}/payments/pending`,
  paymentsStats: `${API_BASE_URL}/payments/stats`,
  paymentRefund: (id: string) => `${API_BASE_URL}/payments/${id}/refund`,
  
  // Inventory endpoints
  inventory: `${API_BASE_URL}/inventory`,
  inventoryById: (id: string) => `${API_BASE_URL}/inventory/${id}`,
  inventoryAdjustStock: (id: string) => `${API_BASE_URL}/inventory/${id}/adjust-stock`,
  inventoryMovements: (id: string) => `${API_BASE_URL}/inventory/${id}/movements`,
  inventoryReorderLevel: (id: string) => `${API_BASE_URL}/inventory/${id}/reorder-level`,
  inventoryPermissions: `${API_BASE_URL}/inventory/permissions`,
  
  // Approval endpoints
  approvals: `${API_BASE_URL}/approvals`,
  approvalById: (id: string) => `${API_BASE_URL}/approvals/${id}`,
  approvalsPending: `${API_BASE_URL}/approvals/pending`,
  approvalApprove: (id: string) => `${API_BASE_URL}/approvals/${id}/approve`,
  approvalReject: (id: string) => `${API_BASE_URL}/approvals/${id}/reject`,
  approvalMarkPaid: (id: string) => `${API_BASE_URL}/approvals/${id}/mark-paid`,
  
  // Permission endpoints
  permissionsTest: `${API_BASE_URL}/permissions/test`,
  permissionsMatrix: `${API_BASE_URL}/permissions/matrix`,
  permissionsRoles: `${API_BASE_URL}/permissions/roles`,
  permissionsRoleByType: (roleType: string) => `${API_BASE_URL}/permissions/roles/${roleType}`,
  permissionsModules: `${API_BASE_URL}/permissions/modules`,
  permissionsStatistics: `${API_BASE_URL}/permissions/statistics`,
  permissionsValidate: `${API_BASE_URL}/permissions/validate`,
  permissionsRecommendRole: `${API_BASE_URL}/permissions/recommend-role`,
  permissionsUserPermissions: `${API_BASE_URL}/permissions/user-permissions`,
  permissionsCheckPermission: `${API_BASE_URL}/permissions/check-permission`,
  permissionsCheckMultiplePermissions: `${API_BASE_URL}/permissions/check-multiple-permissions`,
  permissionsAvailablePermissions: `${API_BASE_URL}/permissions/available-permissions`,
  permissionsRoleComparison: `${API_BASE_URL}/permissions/role-comparison`,
  
  // Compatibility test endpoints
  compatibilityTestStatus: `${API_BASE_URL}/compatibility-test/status`,
  compatibilityTestOldPermissions: `${API_BASE_URL}/compatibility-test/test-old-permissions`,
  compatibilityTestPermissionMapping: `${API_BASE_URL}/compatibility-test/test-permission-mapping`,
  compatibilityTestRoleMapping: `${API_BASE_URL}/compatibility-test/test-role-mapping`,
  
  // Users endpoints
  users: `${API_BASE_URL}/users`,
  
  // Audit logs endpoints
  auditLogs: `${API_BASE_URL}/audit-logs`,
  
  // Reports endpoints
  reports: {
    sales: `${API_BASE_URL}/reports/sales`,
    inventory: `${API_BASE_URL}/reports/inventory`,
    customers: `${API_BASE_URL}/reports/customers`,
    payments: `${API_BASE_URL}/reports/payments`,
    finance: `${API_BASE_URL}/reports/finance`,
  },
  
  // Dashboard endpoints
  dashboard: `${API_BASE_URL}/dashboard`,

  // Expenses endpoints
  expenses: `${API_BASE_URL}/expenses`,

  // Settings endpoints
  settings: `${API_BASE_URL}/settings`,

  // Session endpoints
  sessions: `${API_BASE_URL}/sessions`,
  sessionById: (id: string) => `${API_BASE_URL}/sessions/${id}`,
  sessionsActive: `${API_BASE_URL}/sessions/active`,
  sessionsStats: `${API_BASE_URL}/sessions/stats`,
  sessionsOthers: `${API_BASE_URL}/sessions/others`,

  // API documentation
  apiDocs: `${API_BASE_URL}/api/docs`,
}; 