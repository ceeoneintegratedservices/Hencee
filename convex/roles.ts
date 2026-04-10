import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

const SELF_SERVE_BLOCKED = new Set(["Admin", "Customer", "Staff"]);

/** Roles a new user may request on `/pick-role` (excludes Admin, Customer, Staff). */
export const listForRoleRequest = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    const rows = await ctx.db.query("roles").collect();
    return rows
      .filter((r) => !SELF_SERVE_BLOCKED.has(r.roleType))
      .map((r) => ({
        id: r._id,
        name: r.name,
        roleType: r.roleType,
        description: r.description,
      }));
  },
});

/**
 * Canonical roles + permissions. Run `npx convex run roles:seedRoles` (or call from admin UI)
 * to upsert into the `roles` table.
 */
export type SeedRole = {
  name: string;
  roleType: string;
  description: string;
  permissions: string[];
};

const P_ADMIN: string[] = [
  "users.view",
  "users.create",
  "users.edit",
  "users.delete",
  "users.assign_roles",
  "roles.view",
  "roles.create",
  "roles.edit",
  "roles.delete",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "categories.view",
  "categories.create",
  "categories.update",
  "categories.delete",
  "warehouses.view",
  "warehouses.create",
  "warehouses.update",
  "warehouses.delete",
  "inventory.view",
  "inventory.create",
  "inventory.update",
  "inventory.delete",
  "inventory.stock_adjust",
  "inventory.view_movements",
  "inventory.set_reorder_level",
  "inventory.view_cost_price",
  "sales.view",
  "sales.create",
  "sales.update",
  "sales.edit",
  "sales.delete",
  "sales.reports.view",
  "sales.payments.create",
  "sales.process_refund",
  "customers.view",
  "customers.create",
  "customers.update",
  "customers.delete",
  "payments.view",
  "payments.create",
  "payments.update",
  "payments.refund",
  "payments.reports.view",
  "approvals.view",
  "approvals.approve",
  "approvals.reject",
  "approve.user_accounts",
  "reject.user_accounts",
  "approve.refund",
  "reject.refund",
  "expenses.view",
  "expenses.create",
  "expenses.edit",
  "expenses.delete",
  "expenses.approve",
  "expenses.mark_paid",
  "requests.view",
  "requests.create",
  "requests.manage",
  "audits.view",
  "dashboard.view",
  "view_reports",
  "analytics.view",
  "notifications.view",
  "notifications.create",
  "notifications.edit",
  "notifications.delete",
  "notifications.send",
  "settings.maintenance",
];

const P_MD: string[] = [
  "dashboard.view",
  "view_reports",
  "sales.view",
  "sales.reports.view",
  "customers.view",
  "products.view",
  "inventory.view",
  "approvals.view",
  "approvals.approve",
  "approvals.reject",
  "approve.user_accounts",
  "reject.user_accounts",
  "expenses.view",
  "expenses.approve",
  "expenses.mark_paid",
  "requests.view",
  "requests.manage",
];

const P_ACCOUNTANT: string[] = [
  "dashboard.view",
  "view_reports",
  "sales.view",
  "sales.reports.view",
  "customers.view",
  "products.view",
  "inventory.view",
  "inventory.view_cost_price",
  "expenses.view",
  "expenses.create",
  "expenses.edit",
  "expenses.delete",
  "expenses.approve",
  "expenses.mark_paid",
];

const P_STOREKEEPER: string[] = [
  "products.view",
  "products.create",
  "products.update",
  "categories.view",
  "warehouses.view",
  "inventory.view",
  "inventory.create",
  "inventory.update",
  "inventory.stock_adjust",
  "inventory.view_movements",
  "inventory.set_reorder_level",
  "inventory.view_cost_price",
  "dashboard.view",
];

const P_BOOK_STOREKEEPER: string[] = [
  "products.view",
  "products.create",
  "products.update",
  "categories.view",
  "warehouses.view",
  "inventory.view",
  "inventory.create",
  "inventory.update",
  "inventory.stock_adjust",
  "inventory.view_cost_price",
  "dashboard.view",
];

const P_SALES_REP: string[] = [
  "dashboard.view",
  "sales.view",
  "sales.create",
  "sales.update",
  "sales.payments.create",
  "customers.view",
  "customers.create",
  "customers.update",
  "products.view",
  "inventory.view",
  "warehouses.view",
  "approvals.view",
  "expenses.view",
  "expenses.create",
  "notifications.view",
];

const P_AUDITOR: string[] = [
  "dashboard.view",
  "view_reports",
  "products.view",
  "inventory.view",
  "warehouses.view",
  "expenses.view",
  "approvals.view",
  "requests.view",
  "audits.view",
  "notifications.view",
];

const P_GM: string[] = [
  "dashboard.view",
  "view_reports",
  "users.view",
  "users.edit",
  "users.assign_roles",
  "roles.view",
  "sales.view",
  "sales.reports.view",
  "customers.view",
  "products.view",
  "inventory.view",
  "warehouses.view",
  "approvals.view",
  "approvals.approve",
  "approvals.reject",
  "expenses.view",
  "expenses.approve",
  "expenses.mark_paid",
  "requests.view",
  "requests.manage",
  "audits.view",
  "notifications.view",
];

const P_HR: string[] = [
  "users.view",
  "users.create",
  "users.edit",
  "users.delete",
  "users.assign_roles",
  "roles.view",
  "approve.user_accounts",
  "reject.user_accounts",
  "dashboard.view",
];

const P_IT: string[] = [
  "users.view",
  "users.edit",
  "dashboard.view",
  "notifications.view",
  "view_reports",
  "settings.maintenance",
];

/** Default Convex `ensureProfile` role for non–first-user signups before an admin assigns a role. */
const P_STAFF: string[] = ["dashboard.view"];

/** Map canonical seed perms to UI/menu permission strings used in `PermissionService` menus. */
function withMenuAliases(perms: readonly string[]): string[] {
  const s = new Set(perms);
  if (s.has("view_reports")) {
    s.add("reports.view");
  }
  if (s.has("audits.view")) {
    s.add("audit.view_logs");
  }
  if (s.has("settings.maintenance")) {
    s.add("settings.view");
  }
  return Array.from(s);
}

/** Source of truth for `roles:seedRoles` (12 roles; Customer has no backend perms in seed). */
export const SEED_ROLES: SeedRole[] = [
  {
    name: "Administrator",
    roleType: "Admin",
    description: "Full system access",
    permissions: P_ADMIN,
  },
  {
    name: "Managing Director",
    roleType: "MD",
    description: "Strategy & approvals",
    permissions: P_MD,
  },
  {
    name: "Accountant",
    roleType: "Accountant",
    description: "Finance & expenses",
    permissions: P_ACCOUNTANT,
  },
  {
    name: "Storekeeper",
    roleType: "Storekeeper",
    description: "Inventory & products",
    permissions: P_STOREKEEPER,
  },
  {
    name: "Book Storekeeper",
    roleType: "Book Storekeeper",
    description: "Store + dashboard",
    permissions: P_BOOK_STOREKEEPER,
  },
  {
    name: "Sales Rep",
    roleType: "Sales Rep",
    description: "Sales & customers",
    permissions: P_SALES_REP,
  },
  {
    name: "Auditor",
    roleType: "Auditor",
    description: "Read-only audits/reports/ops",
    permissions: P_AUDITOR,
  },
  {
    name: "General Manager",
    roleType: "GM",
    description: "Operational oversight",
    permissions: P_GM,
  },
  {
    name: "HR",
    roleType: "HR",
    description: "Users & onboarding",
    permissions: P_HR,
  },
  {
    name: "IT Support",
    roleType: "IT Support",
    description: "IT & maintenance",
    permissions: P_IT,
  },
  {
    name: "Staff",
    roleType: "Staff",
    description: "Default staff until an administrator assigns a role",
    permissions: P_STAFF,
  },
  {
    name: "Customer",
    roleType: "Customer",
    description: "Portal (minimal backend perms in seed)",
    permissions: [],
  },
];

/** Upserts all seed roles by `roleType`. Safe to run multiple times. */
export const seedRoles = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let inserted = 0;
    let updated = 0;

    for (const row of SEED_ROLES) {
      const permissions = withMenuAliases(row.permissions);
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_roleType", (q) => q.eq("roleType", row.roleType))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: row.name,
          description: row.description,
          permissions,
          updatedAt: now,
        });
        updated += 1;
      } else {
        await ctx.db.insert("roles", {
          name: row.name,
          description: row.description,
          roleType: row.roleType,
          permissions,
          updatedAt: now,
        });
        inserted += 1;
      }
    }

    return {
      ok: true,
      total: SEED_ROLES.length,
      inserted,
      updated,
    };
  },
});
