"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Redirects to /login when Convex has no authenticated user (e.g. signed out).
 * Use on staff pages that rely on Convex + Clerk; middleware already protects routes when Clerk is configured.
 */
export function useRequireConvexAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  return { isLoading, isAuthenticated };
}
