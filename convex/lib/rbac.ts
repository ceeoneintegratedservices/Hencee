import type { Doc } from "../_generated/dataModel";

export function profileHasPermission(profile: Doc<"profiles">, key: string): boolean {
  const perms = profile.permissions ?? [];
  if (perms.includes("*")) {
    return true;
  }
  return perms.includes(key);
}

/** Matches client `isAdministratorRole` in `src/services/permissions.ts` — full access in UI for Admin. */
export function isAdministratorProfile(profile: Doc<"profiles">): boolean {
  const rn = (profile.roleName ?? "").trim().toLowerCase();
  const rt = (profile.roleType ?? "").trim().toLowerCase();
  return rt === "admin" || rn === "administrator" || rn === "admin";
}

/**
 * Role assignment APIs: must match client `hasPermission('users.assign_roles')`, which grants
 * all permissions to Administrator. Bootstrap admins previously lacked `users.assign_roles` on
 * the profile document while still being Admin — that caused Forbidden on `listPending`.
 */
export function profileMayAssignRoles(profile: Doc<"profiles">): boolean {
  if (isAdministratorProfile(profile)) {
    return true;
  }
  return profileHasPermission(profile, "users.assign_roles");
}
