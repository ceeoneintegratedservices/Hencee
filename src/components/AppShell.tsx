"use client";

import type { ReactNode } from "react";
import { PermissionsProvider } from "@/hooks/usePermissions";
import { ProfileSync } from "@/components/ProfileSync";
import { RedirectToPickRole } from "@/components/RedirectToPickRole";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <PermissionsProvider>
      <ProfileSync />
      <RedirectToPickRole />
      {children}
    </PermissionsProvider>
  );
}
