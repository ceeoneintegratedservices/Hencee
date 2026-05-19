/**
 * Picks the first app route after Clerk sign-in from Convex profile role/permissions.
 */
export type ProfileForRouting = {
  roleType?: string | null;
  roleName?: string | null;
  permissions?: string[] | null;
  approvalStatus?: "pending" | "approved" | "rejected" | null;
  mustSelectRole?: boolean | null;
  pendingRoleRequestId?: string | null;
};

function hasPerm(perms: string[], key: string): boolean {
  return perms.includes(key);
}

/** Permission-first landing; role used when permissions are empty. */
export function getPostSignInPath(profile: ProfileForRouting | null | undefined): string {
  if (!profile) {
    return "/dashboard";
  }

  const approval = profile.approvalStatus ?? "approved";
  if (approval === "pending") {
    return "/login?notice=approval-pending";
  }
  if (approval === "rejected") {
    return "/login?notice=approval-rejected";
  }

  if (profile.mustSelectRole === true || profile.pendingRoleRequestId) {
    return "/pick-role";
  }

  const roleType = (profile.roleType ?? "").trim();
  const roleName = (profile.roleName ?? "").trim();
  const rt = roleType.toLowerCase();
  const rn = roleName.toLowerCase();
  const perms = profile.permissions ?? [];

  if (roleType === "Customer" || rt === "customer" || rn === "customer" || rt.includes("customer")) {
    return "/customer-portal";
  }

  // Permission-based routing (highest priority for staff)
  if (hasPerm(perms, "dashboard.view")) return "/dashboard";
  if (hasPerm(perms, "sales.view")) return "/orders";
  if (hasPerm(perms, "inventory.view") || hasPerm(perms, "products.view")) return "/inventory";
  if (hasPerm(perms, "customers.view")) return "/customers";
  if (
    hasPerm(perms, "approvals.view") ||
    hasPerm(perms, "approval.view_requests") ||
    hasPerm(perms, "approve.daily_expense")
  ) {
    return "/approvals";
  }
  if (hasPerm(perms, "reports.view") || hasPerm(perms, "view_reports")) return "/reports";
  if (hasPerm(perms, "users.view") || hasPerm(perms, "view_users")) return "/users-roles";
  if (hasPerm(perms, "expenses.view") || hasPerm(perms, "view_expenses")) return "/expenses";
  if (hasPerm(perms, "expenses.create")) return "/expenses?mode=request";
  if (hasPerm(perms, "settings.view")) return "/settings";

  // Role fallbacks when permissions not yet assigned
  if (rt === "admin" || roleType === "ADMIN" || roleType === "Admin") return "/dashboard";
  if (roleType === "MD" || rt === "md" || rn.includes("managing director")) return "/dashboard";
  if (roleType === "GM" || rt === "gm" || rn.includes("general manager")) return "/dashboard";
  if (roleType === "Staff" || rt === "staff") return "/orders";
  if (roleType === "Accountant" || rt === "accountant") return "/expenses";
  if (roleType === "Auditor" || rt === "auditor") return "/reports";
  if (roleType === "HR" || rt === "hr") return "/users-roles";
  if (roleType === "IT Support" || rt === "it support") return "/settings";
  if (roleType === "Book Storekeeper" || rt === "book storekeeper" || rt === "book_storekeeper") {
    return "/inventory";
  }
  if (
    roleType === "SALES_REP" ||
    roleType === "sales_staff" ||
    roleType === "Sales Rep" ||
    rt === "sales rep" ||
    rt === "sales_rep" ||
    rt.includes("sales")
  ) {
    return "/orders";
  }
  if (roleType === "Storekeeper" || rt === "storekeeper" || rt.includes("inventory clerk")) {
    return "/inventory";
  }

  return "/orders";
}
