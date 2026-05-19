/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as approvals from "../approvals.js";
import type * as auditLogs from "../auditLogs.js";
import type * as categories from "../categories.js";
import type * as customerPortal from "../customerPortal.js";
import type * as customers from "../customers.js";
import type * as dashboard from "../dashboard.js";
import type * as expenses from "../expenses.js";
import type * as http from "../http.js";
import type * as internalRequests from "../internalRequests.js";
import type * as inventory from "../inventory.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_rbac from "../lib/rbac.js";
import type * as lib_resolveWarehouse from "../lib/resolveWarehouse.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as permissions from "../permissions.js";
import type * as pharmaPresets from "../pharmaPresets.js";
import type * as products from "../products.js";
import type * as profiles from "../profiles.js";
import type * as reports from "../reports.js";
import type * as roleRequests from "../roleRequests.js";
import type * as roles from "../roles.js";
import type * as sales from "../sales.js";
import type * as sessions from "../sessions.js";
import type * as settings from "../settings.js";
import type * as tires from "../tires.js";
import type * as users from "../users.js";
import type * as warehouses from "../warehouses.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  approvals: typeof approvals;
  auditLogs: typeof auditLogs;
  categories: typeof categories;
  customerPortal: typeof customerPortal;
  customers: typeof customers;
  dashboard: typeof dashboard;
  expenses: typeof expenses;
  http: typeof http;
  internalRequests: typeof internalRequests;
  inventory: typeof inventory;
  "lib/auth": typeof lib_auth;
  "lib/rbac": typeof lib_rbac;
  "lib/resolveWarehouse": typeof lib_resolveWarehouse;
  notifications: typeof notifications;
  payments: typeof payments;
  permissions: typeof permissions;
  pharmaPresets: typeof pharmaPresets;
  products: typeof products;
  profiles: typeof profiles;
  reports: typeof reports;
  roleRequests: typeof roleRequests;
  roles: typeof roles;
  sales: typeof sales;
  sessions: typeof sessions;
  settings: typeof settings;
  tires: typeof tires;
  users: typeof users;
  warehouses: typeof warehouses;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
