"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const PATH_PREFIX_ALLOW = [
  "/pick-role",
  "/login",
  "/signup",
  "/post-signin",
  "/account",
  "/customer-portal",
  "/password-recovery",
  "/verify-email",
];

function isAllowedPath(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }
  return PATH_PREFIX_ALLOW.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Sends staff users to /pick-role until they submit a role request (and while a request is pending approval).
 */
export function RedirectToPickRole({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const status = useQuery(api.roleRequests.myStatus, isAuthenticated ? {} : "skip");

  useEffect(() => {
    if (authLoading || !isAuthenticated || status === undefined || status === null) {
      return;
    }
    if (isAllowedPath(pathname)) {
      return;
    }

    if (status.isCustomer) {
      return;
    }

    // Pending role request row exists while admin has not approved/rejected yet.
    if (status.mustSelectRole || status.pendingRoleRequest) {
      router.replace("/pick-role");
    }
  }, [authLoading, isAuthenticated, status, pathname, router]);

  return <>{children}</>;
}
