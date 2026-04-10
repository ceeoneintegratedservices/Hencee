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

  if (roleType === "Customer" || rt === "customer" || rn === "customer" || rt.includes("customer")) {
    return "/customer-portal";
  }

  if (rt === "admin" || roleType === "ADMIN" || roleType === "Admin") {
    return "/dashboard";
  }

  if (roleType === "Staff" || rt === "staff") {
    return "/dashboard";
  }

  if (roleType === "MD" || rt === "md" || rn.includes("managing director")) {
    return "/dashboard";
  }

  if (roleType === "GM" || rt === "gm" || rn.includes("general manager")) {
    return "/dashboard";
  }

  if (roleType === "Accountant" || rt === "accountant") {
    return "/expenses";
  }

  if (roleType === "Auditor" || rt === "auditor") {
    return "/reports";
  }

  if (roleType === "HR" || rt === "hr") {
    return "/users-roles";
  }

  if (roleType === "IT Support" || rt === "it support") {
    return "/settings";
  }

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

  const perms = profile.permissions ?? [];
  if (perms.includes("view_users") || perms.includes("users.view")) {
    return "/users-roles";
  }
  if (perms.includes("view_expenses") || perms.includes("expenses.view")) {
    return "/expenses";
  }
  if (perms.includes("view_reports") || perms.includes("reports.view")) {
    return "/reports";
  }
  if (perms.includes("view_inventory") || perms.includes("inventory.view")) {
    return "/inventory";
  }

  return "/dashboard";
}
