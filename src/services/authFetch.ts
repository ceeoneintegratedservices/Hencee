import { API_BASE_URL, API_ENDPOINTS } from "../config/api";
import { isTokenExpired, checkAndClearExpiredTokens, redirectToLogin, hasValidAuth } from "../utils/tokenUtils";

// Track if we're currently refreshing to avoid multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(API_ENDPOINTS.refresh, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      const newAccessToken = data.accessToken || data.token || data.access_token;

      if (newAccessToken) {
        localStorage.setItem("accessToken", newAccessToken);
        // Update refresh token if provided
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }
        return newAccessToken;
      }

      throw new Error("No access token in refresh response");
    } catch (error) {
      // Refresh failed - clear tokens and redirect to login
      // Use the utility function to prevent multiple redirects
      if (typeof window !== "undefined") {
        redirectToLogin();
      }
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function authFetch(pathOrUrl: string, options: RequestInit = {}) {
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const url = isAbsolute ? pathOrUrl : `${API_BASE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;

  // Check if tokens are expired before making the request
  // Skip this check for auth endpoints (login, refresh, etc.)
  const isAuthEndpoint = url.includes("/api/ceeone/auth/");
  if (!isAuthEndpoint && typeof window !== "undefined") {
    // Check and clear expired tokens
    if (checkAndClearExpiredTokens()) {
      // Tokens were expired and cleared, check if we have valid auth
      if (!hasValidAuth()) {
        // No valid auth, redirect to login
        redirectToLogin();
        throw new Error("Session expired. Please log in again.");
      }
    }
  }

  let token: string | null = null;
  if (typeof window !== "undefined") {
    try { token = localStorage.getItem("accessToken") || localStorage.getItem("authToken"); } catch { token = null; }
    
    // If token exists but is expired, and this is not an auth endpoint, don't use it
    if (token && !isAuthEndpoint && isTokenExpired(token)) {
      // Token is expired, try to refresh if we have refresh token
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        // No refresh token, clear everything and redirect
        checkAndClearExpiredTokens();
        if (!hasValidAuth()) {
          redirectToLogin();
          throw new Error("Session expired. Please log in again.");
        }
      }
      // If we have refresh token, let the 401 handler deal with it
    }
  }

  const mergedHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers: mergedHeaders });
  if (process.env.NODE_ENV !== "production") {
    try { console.debug("authFetch complete:", { url, status: res.status }); } catch {}
  }

  // Handle 401 - try to refresh token
  if (res.status === 401) {
    // Don't retry if this is already a refresh request or auth endpoint
    if (url.includes("/api/ceeone/auth/refresh") || url.includes("/api/ceeone/auth/login")) {
      // Use utility function to prevent multiple redirects
      if (typeof window !== "undefined") {
        redirectToLogin();
      }
      throw new Error("Unauthorized (401). Please log in to continue.");
    }

    // Try to refresh the token
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Retry the original request with the new token
      const retryHeaders: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
        ...(options.headers || {}),
      };
      
      const retryRes = await fetch(url, { ...options, headers: retryHeaders });
      if (process.env.NODE_ENV !== "production") {
        try { console.debug("authFetch retry complete:", { url, status: retryRes.status }); } catch {}
      }
      
      if (retryRes.status === 401) {
        // Still 401 after refresh - redirect to login
        // Use utility function to prevent multiple redirects
        if (typeof window !== "undefined") {
          redirectToLogin();
        }
        throw new Error("Unauthorized (401). Please log in to continue.");
      }
      
      if (retryRes.status === 403) {
        throw new Error("Forbidden (403). You do not have permission to perform this action.");
      }
      
      return retryRes;
    } else {
      // Refresh failed - already redirected to login
      throw new Error("Session expired. Please log in again.");
    }
  }
  
  if (res.status === 403) {
    throw new Error("Forbidden (403). You do not have permission to perform this action.");
  }
  
  return res;
}


