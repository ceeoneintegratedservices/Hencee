/**
 * Legacy redirect helper for non-React code paths (e.g. API error handlers).
 * Authentication is enforced by Clerk + Convex; JWTs in localStorage are not used.
 */

let isRedirecting = false;

export function redirectToLogin(): void {
  if (isRedirecting) {
    return;
  }
  if (typeof window === "undefined") {
    return;
  }

  isRedirecting = true;

  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
  } catch {
    /* ignore */
  }

  window.location.href = "/login";
}

export function resetRedirectFlag(): void {
  isRedirecting = false;
}
