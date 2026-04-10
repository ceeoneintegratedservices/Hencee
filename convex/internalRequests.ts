import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProfile } from "./lib/auth";
import { profileHasPermission } from "./lib/rbac";
import type { Doc } from "./_generated/dataModel";

function mayView(profile: Doc<"profiles">) {
  return (
    profileHasPermission(profile, "requests.view") ||
    profileHasPermission(profile, "requests.manage")
  );
}

function mayManage(profile: Doc<"profiles">) {
  return profileHasPermission(profile, "requests.manage");
}

export const list = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit = 100 }) => {
    const profile = await requireProfile(ctx);
    if (!mayView(profile)) {
      throw new Error("Forbidden");
    }
    let rows = await ctx.db.query("internalRequests").collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    if (status) {
      rows = rows.filter((r) => r.status === status);
    }
    rows = rows.slice(0, Math.min(limit, 200));
    const out = [];
    for (const r of rows) {
      const requester = await ctx.db.get(r.requesterProfileId);
      out.push({
        id: r._id,
        type: r.type,
        status: r.status,
        title: r.title,
        description: r.description,
        requesterEmail: requester?.email ?? "",
        requesterName: requester?.name ?? requester?.email ?? "",
        assigneeProfileId: r.assigneeProfileId,
        payload: r.payload,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      });
    }
    return out;
  },
});

export const create = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (!profileHasPermission(profile, "requests.create")) {
      throw new Error("Forbidden");
    }
    const t = Date.now();
    const id = await ctx.db.insert("internalRequests", {
      type: args.type,
      status: "pending",
      title: args.title.trim(),
      description: args.description?.trim(),
      requesterProfileId: profile._id,
      payload: args.payload,
      createdAt: t,
      updatedAt: t,
    });
    return { id };
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("internalRequests"),
    status: v.string(),
    assigneeProfileId: v.optional(v.id("profiles")),
  },
  handler: async (ctx, { id, status, assigneeProfileId }) => {
    const profile = await requireProfile(ctx);
    if (!mayManage(profile)) {
      throw new Error("Forbidden");
    }
    const t = Date.now();
    await ctx.db.patch(id, {
      status,
      assigneeProfileId,
      updatedAt: t,
    });
    return { ok: true as const };
  },
});

export const addComment = mutation({
  args: {
    requestId: v.id("internalRequests"),
    body: v.string(),
  },
  handler: async (ctx, { requestId, body }) => {
    const profile = await requireProfile(ctx);
    if (!mayView(profile)) {
      throw new Error("Forbidden");
    }
    const req = await ctx.db.get(requestId);
    if (!req) {
      throw new Error("Not found");
    }
    const t = Date.now();
    await ctx.db.insert("internalRequestComments", {
      requestId,
      authorProfileId: profile._id,
      body: body.trim(),
      createdAt: t,
    });
    await ctx.db.patch(requestId, { updatedAt: t });
    return { ok: true as const };
  },
});

export const commentsFor = query({
  args: { requestId: v.id("internalRequests") },
  handler: async (ctx, { requestId }) => {
    const profile = await requireProfile(ctx);
    if (!mayView(profile)) {
      throw new Error("Forbidden");
    }
    const rows = await ctx.db
      .query("internalRequestComments")
      .withIndex("by_request", (q) => q.eq("requestId", requestId))
      .collect();
    const out = [];
    for (const c of rows) {
      const author = await ctx.db.get(c.authorProfileId);
      out.push({
        id: c._id,
        body: c.body,
        authorName: author?.name ?? author?.email ?? "",
        createdAt: c.createdAt,
      });
    }
    return out.sort((a, b) => a.createdAt - b.createdAt);
  },
});
