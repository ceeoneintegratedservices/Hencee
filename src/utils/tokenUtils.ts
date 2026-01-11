/**
 * Token utility functions for checking expiration and managing token state
 */

// Track if we're currently redirecting to prevent multiple redirects
let isRedirecting = false;

/**
 * Check if a JWT token is expired
 * @param token - JWT token string
 * @returns true if token is expired or invalid, false otherwise
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    
    if (!exp) return true; // No expiration claim
    
    // Check if token expires in the next 5 seconds (buffer for clock skew)
    const now = Math.floor(Date.now() / 1000);
    return exp < (now + 5);
  } catch (error) {
    // If we can't parse the token, consider it expired
    return true;
  }
}

/**
 * Get token expiration timestamp
 * @param token - JWT token string
 * @returns expiration timestamp in seconds, or null if invalid
 */
export function getTokenExpiration(token: string | null): number | null {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if tokens are expired and clear them if so
 * @returns true if tokens were cleared, false otherwise
 */
export function checkAndClearExpiredTokens(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
    
    if (isTokenExpired(accessToken)) {
      // Tokens are expired, clear them
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      return true;
    }
    
    return false;
  } catch (error) {
    // If there's an error accessing localStorage, assume tokens are invalid
    return false;
  }
}

/**
 * Safely redirect to login page, preventing multiple redirects
 */
export function redirectToLogin(): void {
  if (isRedirecting) return; // Already redirecting, prevent loop
  if (typeof window === 'undefined') return;
  
  isRedirecting = true;
  
  // Clear all auth data
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
  } catch (error) {
    // Ignore errors
  }
  
  // Use window.location.href for a hard redirect (prevents React Router issues)
  window.location.href = '/login';
}

/**
 * Reset the redirecting flag (useful for testing or manual reset)
 */
export function resetRedirectFlag(): void {
  isRedirecting = false;
}

/**
 * Check if we have valid authentication tokens
 * @returns true if tokens exist and are not expired
 */
export function hasValidAuth(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Need at least access token or refresh token
    if (!accessToken && !refreshToken) return false;
    
    // If we have access token, check if it's expired
    if (accessToken && !isTokenExpired(accessToken)) {
      return true;
    }
    
    // If access token is expired but we have refresh token, we can still try to refresh
    if (refreshToken) {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}
