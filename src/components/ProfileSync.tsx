"use client";

import { useConvexAuth } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { usePermissions } from "@/hooks/usePermissions";

/** Syncs Convex profile into PermissionsProvider + legacy localStorage userData. */
export function ProfileSync() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensureProfile = useMutation(api.profiles.ensureProfile);
  const profile = useQuery(api.profiles.current);
  const { initializePermissions } = usePermissions();

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }
    void ensureProfile({});
  }, [ensureProfile, isLoading, isAuthenticated]);

  useEffect(() => {
    if (!profile) {
      return;
    }
    const userData = {
      id: profile._id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      name: profile.name,
      approvalStatus: profile.approvalStatus,
      mustSelectRole: profile.mustSelectRole,
      pendingRoleRequestId: profile.pendingRoleRequestId,
      role: {
        name: profile.roleName ?? profile.roleType ?? "user",
        roleType: profile.roleType,
        permissions: profile.permissions ?? [],
      },
      permissions: profile.permissions ?? [],
    };
    try {
      localStorage.setItem("userData", JSON.stringify(userData));
    } catch {
      /* ignore */
    }
    initializePermissions(userData as Parameters<typeof initializePermissions>[0]);
  }, [profile, initializePermissions]);

  return null;
}
