import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireStaff } from "./lib/auth";
import type { Doc } from "./_generated/dataModel";

function inDateRange(
  orderDate: string,
  start?: string,
  end?: string
): boolean {
  const d = orderDate.slice(0, 10);
  if (start && d < start.slice(0, 10)) return false;
  if (end && d > end.slice(0, 10)) return false;
  return true;
}

export const sales = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    groupBy: v.optional(v.string()),
    productId: v.optional(v.string()),
    categoryId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    let rows = await ctx.db.query("sales").collect();
    rows = rows.filter((r) => inDateRange(r.orderDate, args.startDate, args.endDate));
    const totalSales = rows.reduce((a, s) => a + s.totalAmount, 0);
    const totalOrders = rows.length;
    const averageOrderValue = totalOrders ? totalSales / totalOrders : 0;
    return {
      data: [
        {
          period: "range",
          totalSales,
          totalOrders,
          averageOrderValue,
          products: [],
        },
      ],
      summary: {
        totalSales,
        totalOrders,
        averageOrderValue,
        topProducts: [] as {
          id: string;
          name: string;
          totalSold: number;
          revenue: number;
        }[],
        topCategories: [] as {
          id: string;
          name: string;
          totalRevenue: number;
          totalQuantity: number;
          productCount: number;
        }[],
      },
    };
  },
});

export const finance = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    groupBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const salesRows = await ctx.db.query("sales").collect();
    const filteredSales = salesRows.filter((r) =>
      inDateRange(r.orderDate, args.startDate, args.endDate)
    );
    const revenue = filteredSales.reduce((a, s) => a + s.totalAmount, 0);

    let expenses = await ctx.db.query("expenses").collect();
    if (args.startDate || args.endDate) {
      expenses = expenses.filter((e) => {
        const d = e.expenseDate?.slice(0, 10);
        if (!d) return true;
        return inDateRange(d, args.startDate, args.endDate);
      });
    }
    const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
    const profit = revenue - totalExpenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      data: [
        {
          period: "range",
          revenue,
          expenses: totalExpenses,
          profit,
          paymentMethods: [] as { method: string; amount: number; count: number }[],
        },
      ],
      summary: {
        totalRevenue: revenue,
        totalExpenses,
        totalProfit: profit,
        profitMargin,
        paymentMethods: [] as {
          method: string;
          amount: number;
          count: number;
          percentage: number;
        }[],
      },
    };
  },
});

function isOutsourcedSale(s: Doc<"sales">): boolean {
  if (s.saleVariant === "outsourced") {
    return true;
  }
  const m = s.metadata as Record<string, unknown> | undefined;
  if (m?.saleVariant === "outsourced") {
    return true;
  }
  return String(s.orderType ?? "")
    .toLowerCase()
    .includes("outsource");
}

export const outsourced = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    let salesRows = await ctx.db.query("sales").collect();
    salesRows = salesRows.filter((r) =>
      inDateRange(r.orderDate, args.startDate, args.endDate)
    );
    const outsourcedSales = salesRows.filter(isOutsourcedSale);

    const bySupplier = new Map<
      string,
      { orders: number; revenue: number; cost: number }
    >();
    for (const s of outsourcedSales) {
      const name =
        s.outsourcedSupplierName?.trim() ||
        (s.metadata as { outsourcedSupplier?: string } | undefined)
          ?.outsourcedSupplier ||
        "Unknown supplier";
      const revenue =
        s.outsourcedSellingPrice ?? s.totalAmount ?? 0;
      const cost = s.outsourcedCost ?? 0;
      const cur = bySupplier.get(name) ?? { orders: 0, revenue: 0, cost: 0 };
      cur.orders += 1;
      cur.revenue += revenue;
      cur.cost += cost;
      bySupplier.set(name, cur);
    }

    const suppliers = [...bySupplier.entries()].map(([supplierName, v]) => {
      const margin = v.revenue - v.cost;
      const marginPercent =
        v.revenue > 0 ? (margin / v.revenue) * 100 : 0;
      return {
        supplierName,
        orders: v.orders,
        revenue: v.revenue,
        cost: v.cost,
        margin,
        marginPercent,
      };
    });

    const totalRevenue = outsourcedSales.reduce(
      (a, s) => a + (s.outsourcedSellingPrice ?? s.totalAmount),
      0
    );
    const totalCost = outsourcedSales.reduce(
      (a, s) => a + (s.outsourcedCost ?? 0),
      0
    );
    const totalMargin = totalRevenue - totalCost;
    const averageMargin =
      outsourcedSales.length > 0
        ? outsourcedSales.reduce((acc, s) => {
            const rev = s.outsourcedSellingPrice ?? s.totalAmount;
            const cost = s.outsourcedCost ?? 0;
            const m = rev > 0 ? ((rev - cost) / rev) * 100 : 0;
            return acc + m;
          }, 0) / outsourcedSales.length
        : 0;

    const invOut = (await ctx.db.query("inventoryItems").collect()).filter(
      (r) => r.isOutsourced
    );

    const statusCounts = new Map<string, number>();
    for (const s of outsourcedSales) {
      const st = String(s.status);
      statusCounts.set(st, (statusCounts.get(st) ?? 0) + 1);
    }
    const paymentStatus = [...statusCounts.entries()].map(
      ([status, count]) => ({ status, count, amount: undefined as number | undefined })
    );

    return {
      summary: {
        totalOrders: outsourcedSales.length,
        totalRevenue,
        totalCost,
        totalMargin,
        averageMargin,
        outstandingBalance: 0,
      },
      suppliers,
      paymentStatus,
      timeline: [] as { period: string; revenue?: number }[],
      outsourcedProducts: invOut.length,
    };
  },
});
