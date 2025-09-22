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
  
  // Sales endpoints
  sales: `${API_BASE_URL}/sales`,
  salesDashboard: `${API_BASE_URL}/sales/dashboard`,
  
  // Payment endpoints
  payments: `${API_BASE_URL}/payments`,
  
  // API documentation
  apiDocs: `${API_BASE_URL}/api`,
}; 