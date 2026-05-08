import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStaff } from "./lib/auth";
import type { Doc, Id } from "./_generated/dataModel";

function ts() {
  return Date.now();
}

function randomTracking() {
  return `TRK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

type PaymentRow = Doc<"payments">;

function sumCompletedPayments(rows: PaymentRow[]): number {
  return rows.reduce((acc, row) => {
    const status = String(row.status ?? "").toUpperCase();
    if (status !== "COMPLETED") return acc;
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

async function loadSalePayments(ctx: any, saleId: Id<"sales">) {
  return await ctx.db
    .query("payments")
    .withIndex("by_sale", (q: any) => q.eq("saleId", saleId))
    .collect();
}

async function adjustCustomerOutstanding(
  ctx: any,
  customerId: Id<"customers">,
  delta: number
) {
  if (!delta) return;
  const customer = await ctx.db.get(customerId);
  if (!customer) return;
  const current = Number(customer.outstandingBalance ?? 0);
  await ctx.db.patch(customerId, {
    outstandingBalance: Math.max(current + delta, 0),
    updatedAt: ts(),
  });
}

function formatOrder(
  sale: Doc<"sales">,
  customer: Doc<"customers"> | null,
  payments: PaymentRow[] = []
) {
  const c = customer;
  const totalPaid = sumCompletedPayments(payments);
  const paymentState = derivePaymentState(sale.totalAmount, totalPaid);
  const metadata = (sale.metadata ?? {}) as Record<string, unknown>;
  const storedOutstanding =
    typeof metadata.outstandingBalance === "number"
      ? Number(metadata.outstandingBalance)
      : undefined;
  const outstandingBalance =
    storedOutstanding != null ? storedOutstanding : paymentState.outstanding;
  return {
    id: sale._id,
    customerId: sale.customerId,
    orderNumber: sale.orderNumber,
    orderDate: sale.orderDate,
    trackingId: sale.trackingId ?? randomTracking(),
    customer: {
      id: customer?._id ?? sale.customerId,
      name: c?.name ?? "Unknown",
      email: c?.email ?? "",
      phone: c?.phone ?? "",
      customerSince: c?.customerSince ?? new Date(c?.createdAt ?? 0).toISOString(),
      status: (c?.status as "Active" | "Pending" | "Inactive") ?? "Active",
    },
    homeAddress: sale.homeAddress ?? c?.address ?? "",
    billingAddress: sale.billingAddress ?? c?.address ?? "",
    paymentMethod: sale.paymentMethod ?? "—",
    payment: sale.payment ?? paymentState.payment,
    paymentAmount:
      sale.paymentAmount != null ? String(sale.paymentAmount) : String(totalPaid),
    paymentStatus: paymentState.paymentStatus,
    outstandingBalance,
    orderType: sale.orderType ?? "Standard",
    saleVariant: sale.saleVariant ?? "standard",
    isOutsourced: sale.saleVariant === "outsourced",
    outsourcedSupplierName: sale.outsourcedSupplierName,
    outsourcedCost: sale.outsourcedCost,
    outsourcedSellingPrice: sale.outsourcedSellingPrice,
    outsourcedNotes: sale.outsourcedNotes,
    outsourcedImageUrl: sale.outsourcedImageUrl,
    items: Array.isArray(sale.items) ? sale.items : [],
    totalAmount: sale.totalAmount,
    status: sale.status as Doc<"sales">["status"],
    metadata: { ...metadata, outstandingBalance, totalPaid },
    payments: payments.map((row) => ({
      id: row._id,
      method: row.method,
      status: row.status,
      amount: row.amount,
      reference: row.reference,
      senderName: (row.metadata as Record<string, unknown> | undefined)?.senderName,
      transactionReference:
        (row.metadata as Record<string, unknown> | undefined)?.transactionReference,
      chequeNumber: (row.metadata as Record<string, unknown> | undefined)?.chequeNumber,
      accountName: (row.metadata as Record<string, unknown> | undefined)?.accountName,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    })),
    createdAt: new Date(sale.createdAt).toISOString(),
    updatedAt: new Date(sale.updatedAt).toISOString(),
  };
}

export const ordersDashboard = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortDir: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const limit = Math.min(args.limit ?? 20, 100);
    const page = Math.max(args.page ?? 1, 1);
    let rows = await ctx.db.query("sales").order("desc").collect();
    if (args.status) {
      rows = rows.filter((r) => r.status === args.status);
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      rows = rows.filter((r) => r.orderNumber.toLowerCase().includes(s));
    }
    if (args.dateFrom) {
      const from = args.dateFrom;
      rows = rows.filter((r) => r.orderDate >= from);
    }
    if (args.dateTo) {
      const to = args.dateTo;
      const end = to.length <= 10 ? `${to}T23:59:59.999Z` : to;
      rows = rows.filter((r) => r.orderDate <= end);
    }
    const total = rows.length;
    const start = (page - 1) * limit;
    const slice = rows.slice(start, start + limit);
    const orders = [];
    for (const sale of slice) {
      const customer = await ctx.db.get(sale.customerId);
      const salePayments = await loadSalePayments(ctx, sale._id);
      const paidAmount = sumCompletedPayments(salePayments);
      const paymentState = derivePaymentState(sale.totalAmount, paidAmount);
      orders.push({
        id: sale._id,
        customerName: customer?.name ?? "—",
        orderDate: sale.orderDate,
        orderType: sale.orderType ?? "—",
        trackingId: sale.trackingId ?? "—",
        orderTotal: String(sale.totalAmount),
        status: sale.status,
        paymentStatus: paymentState.paymentStatus,
        outstandingBalance: paymentState.outstanding,
        statusColor: undefined,
        action: paymentState.payment,
      });
    }
    const summary = {
      allOrders: rows.length,
      pending: rows.filter((r) => r.status === "Pending" || r.status === "PENDING").length,
      completed: rows.filter((r) => r.status === "Completed" || r.status === "COMPLETED").length,
      canceled: rows.filter((r) => String(r.status).toLowerCase().includes("cancel")).length,
      returned: 0,
      damaged: 0,
      abandonedCart: 0,
      customers: (await ctx.db.query("customers").collect()).length,
    };
    return {
      summary,
      orders,
      total,
      page,
      limit,
    };
  },
});

export const getById = query({
  args: { id: v.id("sales") },
  handler: async (ctx, { id }) => {
    await requireStaff(ctx);
    const sale = await ctx.db.get(id);
    if (!sale) {
      throw new Error("Not found");
    }
    const customer = await ctx.db.get(sale.customerId);
    const salePayments = await loadSalePayments(ctx, id);
    return formatOrder(sale, customer, salePayments);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("sales"),
    status: v.string(),
  },
  handler: async (ctx, { id, status }) => {
    await requireStaff(ctx);
    await ctx.db.patch(id, { status, updatedAt: ts() });
    const sale = await ctx.db.get(id);
    const customer = sale ? await ctx.db.get(sale.customerId) : null;
    const salePayments = sale ? await loadSalePayments(ctx, sale._id) : [];
    return formatOrder(sale!, customer, salePayments);
  },
});

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    items: v.any(),
    totalAmount: v.number(),
    status: v.optional(v.string()),
    orderType: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    metadata: v.optional(v.any()),
    saleVariant: v.optional(
      v.union(v.literal("standard"), v.literal("outsourced"))
    ),
    outsourcedSupplierName: v.optional(v.string()),
    outsourcedCost: v.optional(v.number()),
    outsourcedSellingPrice: v.optional(v.number()),
    outsourcedNotes: v.optional(v.string()),
    outsourcedImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const variant = args.saleVariant ?? "standard";
    if (variant === "outsourced") {
      const supplier = args.outsourcedSupplierName?.trim();
      if (!supplier) {
        throw new Error("Outsourced sales require outsourcedSupplierName");
      }
      if (
        args.outsourcedCost == null ||
        args.outsourcedSellingPrice == null
      ) {
        throw new Error(
          "Outsourced sales require outsourcedCost and outsourcedSellingPrice"
        );
      }
    }
    const t = ts();
    const orderNumber = `ORD-${t}`;
    const metadataInput = (args.metadata ?? {}) as Record<string, unknown>;
    const paymentInput = (metadataInput.payment ?? {}) as Record<string, unknown>;
    const paymentAmountInput = Number(paymentInput.amount ?? 0);
    const paymentStatusInput = String(paymentInput.status ?? "PENDING").toUpperCase();
    const initialPaid =
      paymentAmountInput > 0 && paymentStatusInput === "COMPLETED"
        ? paymentAmountInput
        : 0;
    const initialPaymentState = derivePaymentState(args.totalAmount, initialPaid);

    const id = await ctx.db.insert("sales", {
      customerId: args.customerId,
      orderNumber,
      orderDate: new Date(t).toISOString(),
      trackingId: randomTracking(),
      status: args.status ?? (initialPaymentState.outstanding <= 0 ? "Completed" : "In-Progress"),
      orderType: args.orderType ?? "Standard",
      saleVariant: variant,
      outsourcedSupplierName:
        variant === "outsourced"
          ? args.outsourcedSupplierName?.trim()
          : undefined,
      outsourcedCost:
        variant === "outsourced" ? args.outsourcedCost : undefined,
      outsourcedSellingPrice:
        variant === "outsourced" ? args.outsourcedSellingPrice : undefined,
      outsourcedNotes:
        variant === "outsourced" ? args.outsourcedNotes : undefined,
      outsourcedImageUrl:
        variant === "outsourced" ? args.outsourcedImageUrl : undefined,
      items: args.items,
      totalAmount: args.totalAmount,
      paymentMethod: args.paymentMethod,
      payment: initialPaymentState.payment,
      paymentAmount: initialPaid > 0 ? initialPaid : undefined,
      metadata: {
        ...metadataInput,
        outstandingBalance: initialPaymentState.outstanding,
        outstandingAfter: initialPaymentState.outstanding,
      },
      createdAt: t,
      updatedAt: t,
    });

    if (paymentAmountInput > 0) {
      await ctx.db.insert("payments", {
        saleId: id,
        customerId: args.customerId,
        amount: paymentAmountInput,
        method: (paymentInput.method as string | undefined) ?? args.paymentMethod,
        status: paymentStatusInput || "PENDING",
        reference: paymentInput.reference as string | undefined,
        metadata: {
          senderName: paymentInput.senderName,
          transactionReference: paymentInput.transactionReference,
          chequeNumber: paymentInput.chequeNumber,
          accountName: paymentInput.accountName,
        },
        createdAt: t,
        updatedAt: t,
      });
    }

    if (initialPaymentState.outstanding > 0) {
      await adjustCustomerOutstanding(
        ctx,
        args.customerId,
        initialPaymentState.outstanding
      );
    }

    // Deduct sold quantities from inventory
    const saleItems = Array.isArray(args.items) ? args.items : [];
    for (const item of saleItems) {
      try {
        const productId = (item as Record<string, unknown>).id as Id<"inventoryItems"> | undefined;
        if (!productId) continue;
        const product = await ctx.db.get(productId);
        if (!product) continue;
        const soldQty = Number((item as Record<string, unknown>).quantity ?? 0);
        if (soldQty <= 0) continue;
        const unitType = String((item as Record<string, unknown>).unitType ?? "piece").toLowerCase();
        const inventoryUnits = { ...((product.inventoryUnits as Record<string, number> | undefined) ?? {}) };
        if (unitType === "carton") {
          inventoryUnits.cartonsInStock = Math.max((Number(inventoryUnits.cartonsInStock) || 0) - soldQty, 0);
        } else if (unitType === "roll") {
          inventoryUnits.rollsInStock = Math.max((Number(inventoryUnits.rollsInStock) || 0) - soldQty, 0);
        } else if (unitType === "dozen") {
          inventoryUnits.dozensInStock = Math.max((Number(inventoryUnits.dozensInStock) || 0) - soldQty, 0);
        } else {
          inventoryUnits.piecesInStock = Math.max((Number(inventoryUnits.piecesInStock) || 0) - soldQty, 0);
        }
        await ctx.db.patch(productId, { inventoryUnits, updatedAt: t });
      } catch {
        // Non-fatal: stock deduction failure must not block the sale
      }
    }

    const sale = await ctx.db.get(id);
    const customer = await ctx.db.get(args.customerId);
    const salePayments = await loadSalePayments(ctx, id);
    return formatOrder(sale!, customer, salePayments);
  },
});

export const byCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, { customerId }) => {
    await requireStaff(ctx);
    const rows = await ctx.db
      .query("sales")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .collect();
    const out = [];
    for (const sale of rows) {
      const customer = await ctx.db.get(sale.customerId);
      const salePayments = await loadSalePayments(ctx, sale._id);
      out.push(formatOrder(sale, customer, salePayments));
    }
    return out;
  },
});

export const searchOrders = query({
  args: { query: v.string() },
  handler: async (ctx, { query: q }) => {
    await requireStaff(ctx);
    const s = q.toLowerCase();
    const rows = await ctx.db.query("sales").collect();
    const filtered = rows.filter((r) => r.orderNumber.toLowerCase().includes(s));
    const out = [];
    for (const sale of filtered.slice(0, 50)) {
      const customer = await ctx.db.get(sale.customerId);
      const salePayments = await loadSalePayments(ctx, sale._id);
      out.push(formatOrder(sale, customer, salePayments));
    }
    return out;
  },
});

export const monthlyReport = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("sales").collect();
    return { total: rows.length, revenue: rows.reduce((a, r) => a + r.totalAmount, 0) };
  },
});

export const byDateRange = query({
  args: { dateFrom: v.string(), dateTo: v.string() },
  handler: async (ctx, { dateFrom, dateTo }) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("sales").collect();
    const filtered = rows.filter(
      (r) => r.orderDate >= dateFrom && r.orderDate <= dateTo + "T23:59:59"
    );
    const out = [];
    for (const sale of filtered) {
      const customer = await ctx.db.get(sale.customerId);
      const salePayments = await loadSalePayments(ctx, sale._id);
      out.push(formatOrder(sale, customer, salePayments));
    }
    return out;
  },
});

export const dailyOrders = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("sales").collect();
    const filtered = rows.filter((r) => r.orderDate.startsWith(date));
    const out = [];
    for (const sale of filtered) {
      const customer = await ctx.db.get(sale.customerId);
      const salePayments = await loadSalePayments(ctx, sale._id);
      out.push(formatOrder(sale, customer, salePayments));
    }
    return out;
  },
});

export const pendingPaymentSales = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("sales").collect();
    const pending = rows.filter((r) => {
      const s = String(r.status).toUpperCase();
      return (
        s.includes("PENDING") ||
        s.includes("AWAIT") ||
        s === "UNPAID"
      );
    });
    const out = [];
    for (const sale of pending) {
      const customer = await ctx.db.get(sale.customerId);
      const salePayments = await loadSalePayments(ctx, sale._id);
      out.push(formatOrder(sale, customer, salePayments));
    }
    return out;
  },
});

export const approvePayment = mutation({
  args: {
    id: v.id("sales"),
    amountPaid: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const sale = await ctx.db.get(args.id);
    if (!sale) {
      throw new Error("Not found");
    }
    const t = ts();
    const beforePayments = await loadSalePayments(ctx, args.id);
    const paidBefore = sumCompletedPayments(beforePayments);
    const outstandingBefore = Math.max(sale.totalAmount - paidBefore, 0);
    await ctx.db.insert("payments", {
      saleId: args.id,
      customerId: sale.customerId,
      amount: args.amountPaid,
      method: sale.paymentMethod ?? "cash",
      status: "COMPLETED",
      metadata: args.note ? { note: args.note } : undefined,
      createdAt: t,
      updatedAt: t,
    });
    const prevMeta = (sale.metadata ?? {}) as Record<string, unknown>;
    const trail = Array.isArray(prevMeta.approvalTrail)
      ? [...(prevMeta.approvalTrail as unknown[])]
      : [];
    trail.push({
      action: "APPROVE",
      amountPaid: args.amountPaid,
      note: args.note,
      timestamp: new Date().toISOString(),
    });
    const paidAfter = paidBefore + args.amountPaid;
    const paymentState = derivePaymentState(sale.totalAmount, paidAfter);
    await adjustCustomerOutstanding(
      ctx,
      sale.customerId,
      paymentState.outstanding - outstandingBefore
    );
    await ctx.db.patch(args.id, {
      status: paymentState.outstanding <= 0 ? "Completed" : "In-Progress",
      payment: paymentState.payment,
      paymentAmount: paidAfter,
      metadata: {
        ...prevMeta,
        approvalTrail: trail,
        outstandingBalance: paymentState.outstanding,
        outstandingAfter: paymentState.outstanding,
      },
      updatedAt: t,
    });
    const updated = await ctx.db.get(args.id);
    const customer = await ctx.db.get(sale.customerId);
    const payments = await loadSalePayments(ctx, args.id);
    return formatOrder(updated!, customer, payments);
  },
});

export const queryPayment = mutation({
  args: { id: v.id("sales"), note: v.string() },
  handler: async (ctx, { id, note }) => {
    await requireStaff(ctx);
    const sale = await ctx.db.get(id);
    if (!sale) {
      throw new Error("Not found");
    }
    const t = ts();
    const prevMeta = (sale.metadata ?? {}) as Record<string, unknown>;
    const trail = Array.isArray(prevMeta.approvalTrail)
      ? [...(prevMeta.approvalTrail as unknown[])]
      : [];
    trail.push({
      action: "QUERY",
      note,
      timestamp: new Date().toISOString(),
    });
    await ctx.db.patch(id, {
      status: "Queried",
      metadata: { ...prevMeta, approvalTrail: trail, queryNote: note },
      updatedAt: t,
    });
    const updated = await ctx.db.get(id);
    const customer = await ctx.db.get(sale.customerId);
    const payments = await loadSalePayments(ctx, id);
    return formatOrder(updated!, customer, payments);
  },
});

export const rejectPayment = mutation({
  args: { id: v.id("sales"), note: v.string() },
  handler: async (ctx, { id, note }) => {
    await requireStaff(ctx);
    const sale = await ctx.db.get(id);
    if (!sale) {
      throw new Error("Not found");
    }
    const t = ts();
    const prevMeta = (sale.metadata ?? {}) as Record<string, unknown>;
    const trail = Array.isArray(prevMeta.approvalTrail)
      ? [...(prevMeta.approvalTrail as unknown[])]
      : [];
    trail.push({
      action: "REJECT",
      note,
      timestamp: new Date().toISOString(),
    });
    await ctx.db.patch(id, {
      status: "Rejected",
      metadata: {
        ...prevMeta,
        approvalTrail: trail,
        rejectionReason: note,
      },
      updatedAt: t,
    });
    const updated = await ctx.db.get(id);
    const customer = await ctx.db.get(sale.customerId);
    const payments = await loadSalePayments(ctx, id);
    return formatOrder(updated!, customer, payments);
  },
});
