/**
 * Error handler utility for consistent API error handling
 */

interface ApiError {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

/**
 * Handle API errors and return user-friendly error messages
 */
export function handleApiError(error: any): string {
  // Handle fetch Response errors
  if (error.response) {
    const { status, data } = error.response;
    
    if (status === 401) {
      // Unauthorized - token refresh should handle this, but if we get here, redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userData");
        window.location.href = "/login";
      }
      return "Session expired. Please login again.";
    }
    
    if (status === 403) {
      return "You do not have permission to perform this action.";
    }
    
    if (status === 404) {
      return "Resource not found.";
    }
    
    if (status === 422) {
      // Validation error
      if (Array.isArray(data.message)) {
        return data.message.join(", ");
      }
      return data.message || "Validation error";
    }
    
    if (status === 500) {
      return "Server error. Please try again later.";
    }
    
    // Return the error message from the API if available
    if (data?.message) {
      if (Array.isArray(data.message)) {
        return data.message.join(", ");
      }
      return data.message;
    }
    
    return `An error occurred (${status})`;
  }
  
  // Handle network errors
  if (error.request) {
    // Request made but no response
    return "Network error. Please check your connection.";
  }
  
  // Handle string errors
  if (typeof error === "string") {
    return error;
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle API error objects
  if (error && typeof error === "object") {
    const apiError = error as ApiError;
    if (apiError.message) {
      if (Array.isArray(apiError.message)) {
        return apiError.message.join(", ");
      }
      return apiError.message;
    }
    if (apiError.error) {
      return apiError.error;
    }
  }
  
  return "An unexpected error occurred";
}

/**
 * Extract error message from a fetch Response
 */
export async function extractErrorFromResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data.message) {
      if (Array.isArray(data.message)) {
        return data.message.join(", ");
      }
      return data.message;
    }
    if (data.error) {
      return data.error;
    }
  } catch {
    // If JSON parsing fails, return status text
  }
  
  return response.statusText || `Error ${response.status}`;
}

