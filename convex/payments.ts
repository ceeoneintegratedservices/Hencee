import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStaff } from "./lib/auth";

function ts() {
  return Date.now();
}

function sumCompletedPayments(
  rows: Array<{ status: string; amount: number }>
): number {
  return rows.reduce((acc, row) => {
    if (String(row.status).toUpperCase() !== "COMPLETED") return acc;
    return acc + (Number(row.amount) || 0);
  }, 0);
}

function derivePaymentState(totalAmount: number, paidAmount: number) {
  const outstanding = Math.max(totalAmount - paidAmount, 0);
  if (outstanding <= 0) {
    return { payment: "Full Payment", paymentStatus: "COMPLETED", outstanding };
  }
  if (paidAmount > 0) {
    return { payment: "Part Payment", paymentStatus: "PENDING", outstanding };
  }
  return { payment: "Unpaid", paymentStatus: "PENDING", outstanding };
}

export const list = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    method: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    let rows = await ctx.db.query("payments").order("desc").collect();
    if (args.status) {
      rows = rows.filter((r) => r.status === args.status);
    }
    if (args.method) {
      rows = rows.filter((r) => r.method === args.method);
    }
    return rows;
  },
});

export const get = query({
  args: { id: v.id("payments") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    const p = await ctx.db.get(id);
    if (!p) {
      throw new Error("Not found");
    }
    return p;
  },
});

export const create = mutation({
  args: {
    saleId: v.optional(v.id("sales")),
    customerId: v.optional(v.id("customers")),
    amount: v.number(),
    method: v.optional(v.string()),
    status: v.string(),
    reference: v.optional(v.string()),
    paymentDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const t = ts();
    const paymentId = await ctx.db.insert("payments", {
      ...args,
      createdAt: t,
      updatedAt: t,
    });

    if (args.saleId) {
      const sale = await ctx.db.get(args.saleId);
      if (sale) {
        const customer = await ctx.db.get(sale.customerId);
        const salePayments = await ctx.db
          .query("payments")
          .withIndex("by_sale", (q) => q.eq("saleId", args.saleId))
          .collect();
        const paidAmount = sumCompletedPayments(salePayments);
        const paymentState = derivePaymentState(sale.totalAmount, paidAmount);
        const previousOutstanding = Math.max(
          sale.totalAmount - (sumCompletedPayments(salePayments.filter((p) => p._id !== paymentId))),
          0
        );
        const delta = paymentState.outstanding - previousOutstanding;

        await ctx.db.patch(args.saleId, {
          payment: paymentState.payment,
          paymentAmount: paidAmount > 0 ? paidAmount : undefined,
          status:
            String(sale.status).toLowerCase().includes("cancel") ||
            String(sale.status).toLowerCase().includes("reject")
              ? sale.status
              : paymentState.outstanding <= 0
              ? "Completed"
              : "In-Progress",
          metadata: {
            ...(sale.metadata ?? {}),
            outstandingBalance: paymentState.outstanding,
            outstandingAfter: paymentState.outstanding,
          },
          updatedAt: t,
        });

        if (customer && delta !== 0) {
          await ctx.db.patch(customer._id, {
            outstandingBalance: Math.max(
              Number(customer.outstandingBalance ?? 0) + delta,
              0
            ),
            updatedAt: t,
          });
        }
      }
    }

    return paymentId;
  },
});

export const updateStatus = mutation({
  args: { id: v.id("payments"), status: v.string() },
  handler: async (ctx, { id, status }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { status, updatedAt: ts() });
    return ctx.db.get(id);
  },
});

export const bySale = query({
  args: { saleId: v.id("sales") },
  handler: async (ctx, { saleId }) => {
    await requireStaff(ctx);
    return ctx.db
      .query("payments")
      .withIndex("by_sale", (q) => q.eq("saleId", saleId))
      .collect();
  },
});

export const pending = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    return (await ctx.db.query("payments").collect()).filter(
      (p) => p.status === "pending" || p.status === "PENDING"
    );
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("payments").collect();
    const total = rows.reduce((a, r) => a + r.amount, 0);
    return { totalAmount: total, count: rows.length };
  },
});

export const refund = mutation({
  args: { id: v.id("payments"), reason: v.optional(v.string()) },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { status: "refunded", updatedAt: ts() });
    return ctx.db.get(id);
  },
});

export const byReference = query({
  args: { reference: v.string() },
  handler: async (ctx, { reference }) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("payments").collect();
    return rows.find((r) => r.reference === reference) ?? null;
  },
});
