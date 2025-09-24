// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ceeone-api.onrender.com';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  passwordReset: `${API_BASE_URL}/auth/password-reset`,
  passwordResetConfirm: `${API_BASE_URL}/auth/password-reset-confirm`,
  resendVerification: `${API_BASE_URL}/auth/resend-verification`,
  verifyEmail: `${API_BASE_URL}/auth/verify-email`,
  
  // Product endpoints
  products: `${API_BASE_URL}/products`,
  
  // Customer endpoints
  customers: `${API_BASE_URL}/customers`,
  
  // Orders endpoints
  orders: `${API_BASE_URL}/orders`,
  salesDashboard: `${API_BASE_URL}/sales/dashboard`,
  
  // Payment endpoints
  payments: `${API_BASE_URL}/payments`,
  
  // Approvals endpoints
  approvals: `${API_BASE_URL}/approvals`,
  
  // Users endpoints
  users: `${API_BASE_URL}/users`,
  
  // Reports endpoints
  reports: {
    sales: `${API_BASE_URL}/reports/sales`,
    finance: `${API_BASE_URL}/reports/finance`
  },
  
  // Audit logs endpoint
  auditLogs: `${API_BASE_URL}/audit-logs`,
  
  // API documentation
  apiDocs: `${API_BASE_URL}/api`,
}; 