import type { Doc } from "../_generated/dataModel";

export function profileHasPermission(profile: Doc<"profiles">, key: string): boolean {
  const perms = profile.permissions ?? [];
  if (perms.includes("*")) {
    return true;
  }
  return perms.includes(key);
}

export function profileMayAssignRoles(profile: Doc<"profiles">): boolean {
  return profileHasPermission(profile, "users.assign_roles");
}
