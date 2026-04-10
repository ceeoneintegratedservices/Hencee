import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
}

export async function getProfileDoc(ctx: QueryCtx | MutationCtx, clerkId: string) {
  return ctx.db
    .query("profiles")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
}

export async function requireProfile(ctx: QueryCtx | MutationCtx): Promise<Doc<"profiles">> {
  const identity = await requireIdentity(ctx);
  const profile = await getProfileDoc(ctx, identity.subject);
  if (!profile) {
    throw new Error("Profile not found. Complete sign-in sync.");
  }
  return profile;
}

export function isCustomerRole(profile: Doc<"profiles">): boolean {
  const r = (profile.roleType ?? profile.roleName ?? "").toLowerCase();
  return r.includes("customer");
}

export async function requireStaff(ctx: QueryCtx | MutationCtx): Promise<Doc<"profiles">> {
  const profile = await requireProfile(ctx);
  if (isCustomerRole(profile)) {
    throw new Error("Forbidden");
  }
  if (profile.approvalStatus === "pending" || profile.approvalStatus === "rejected") {
    throw new Error("Account not approved");
  }
  return profile;
}

export type CustomerId = Id<"customers">;
