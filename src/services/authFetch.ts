import { API_BASE_URL } from "../config/api";

export async function authFetch(pathOrUrl: string, options: RequestInit = {}) {
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const url = isAbsolute ? pathOrUrl : `${API_BASE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;

  let token: string | null = null;
  if (typeof window !== "undefined") {
    try { token = localStorage.getItem("authToken"); } catch { token = null; }
  }

  const mergedHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers: mergedHeaders });

  if (res.status === 401) {
    try { localStorage.removeItem("authToken"); } catch {}
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized (401). Please log in to continue.");
  }
  if (res.status === 403) {
    throw new Error("Forbidden (403). You do not have permission to perform this action.");
  }
  return res;
}


