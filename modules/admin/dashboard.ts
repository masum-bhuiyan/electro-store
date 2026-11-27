import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { LOW_STOCK_LIMIT } from "@/modules/admin/stats";
import { variantLabel } from "@/modules/orders/preview-cart";
import { addDays } from "@/modules/cash/book";
import { dhakaToday } from "@/modules/expenses/validation";
import { parseRange } from "@/modules/reports/range";
import { getSalesReport } from "@/modules/reports/sales-report";

export type RangeKey = "today" | "yesterday" | "week" | "month" | "custom";

export type DashRange = {
  key: RangeKey;
  from: string;
  to: string;
  label: string;
  error: string | null;
};

export function resolveDashRange(sp: {
  range?: string;
  from?: string;
  to?: string;
}): DashRange {
  const today = dhakaToday();
  switch (sp.range) {
    case "yesterday": {
      const y = addDays(today, -1);
      return { key: "yesterday", from: y, to: y, label: "গতকাল", error: null };
    }
    case "week":
      return {
        key: "week",
        from: addDays(today, -6),
        to: today,
        label: "গত ৭ দিন",
        error: null,
      };
    case "month":
      return {
        key: "month",
        from: today.slice(0, 8) + "01",
        to: today,
        label: "এই মাস",
        error: null,
      };
    case "custom": {
      const r = parseRange({ from: sp.from, to: sp.to });
      return {
        key: "custom",
        from: r.from,
        to: r.to,
        label: r.from === r.to ? r.from : `${r.from} থেকে ${r.to}`,
        error: r.error,
      };
    }
    default:
      return { key: "today", from: today, to: today, label: "আজ", error: null };
  }
}

function bounds(from: string, to: string) {
  return {
    gte: new Date(`${from}T00:00:00+06:00`),
    lt: new Date(`${addDays(to, 1)}T00:00:00+06:00`),
  };
}

function r2(n: Prisma.Decimal | null | undefined): number {
  return n ? Math.round(Number(n) * 100) / 100 : 0;
}

// ওই সময়ে কতজন আলাদা ক্রেতা কিনেছেন (দোকান + অনলাইন, walk-in বাদ)
export async function getRangeCustomers(from: string, to: string): Promise<number> {
  const range = bounds(from, to);
  const [sales, orders] = await Promise.all([
    prisma.sale.findMany({
      where: { status: "CONFIRMED", createdAt: range, customerId: { not: null } },
      select: { customer: { select: { phone: true } } },
    }),
    prisma.order.findMany({
      where: { status: { in: ["SHIPPED", "DELIVERED"] }, shippedAt: range },
      select: { phone: true },
    }),
  ]);
  const phones = new Set<string>();
  for (const s of sales) if (s.customer?.phone) phones.add(s.customer.phone);
  for (const o of orders) phones.add(o.phone);
  return phones.size;
}

export async function getRangeExpenses(from: string, to: string): Promise<number> {
  const agg = await prisma.expense.aggregate({
    where: { voidedAt: null, expenseDate: bounds(from, to) },
    _sum: { amount: true },
  });
  return r2(agg._sum.amount);
}

export type ChartDay = {
  day: string;
  total: number;
  pos: number;
  online: number;
  returns: number;
};

// শেষ N দিন, বিক্রয় না থাকা দিনও ০ হিসেবে
export async function getChartDays(days: number): Promise<ChartDay[]> {
  const today = dhakaToday();
  const from = addDays(today, -(days - 1));
  const report = await getSalesReport({ from, to: today, type: "ALL" });
  const map = new Map(report.rows.map((r) => [r.day, r]));
  const out: ChartDay[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(from, i);
    const row = map.get(day);
    out.push({
      day,
      total: row?.net ?? 0,
      pos: row?.pos ?? 0,
      online: row?.online ?? 0,
      returns: row?.returns ?? 0,
    });
  }
  return out;
}

// অপেক্ষমান: অনলাইন PENDING অর্ডার + অফলাইন ড্রাফট
export async function getPendingSummary(
  includeOnline: boolean,
  includeDrafts: boolean
): Promise<{ online: number; drafts: number }> {
  const [online, drafts] = await Promise.all([
    includeOnline ? prisma.order.count({ where: { status: "PENDING" } }) : 0,
    includeDrafts ? prisma.sale.count({ where: { status: "DRAFT" } }) : 0,
  ]);
  return { online, drafts };
}

// লগইন করা কর্মচারীর নিজের বিক্রয়
export async function getMySales(
  staffName: string,
  from: string,
  to: string
): Promise<{ bills: number; total: number; customers: number }> {
  const rows = await prisma.sale.findMany({
    where: { status: "CONFIRMED", staffName, createdAt: bounds(from, to) },
    select: { subtotal: true, customerId: true },
  });
  let total = new Prisma.Decimal(0);
  const ids = new Set<string>();
  for (const r of rows) {
    total = total.plus(r.subtotal);
    if (r.customerId) ids.add(r.customerId);
  }
  return { bills: rows.length, total: r2(total), customers: ids.size };
}

// মালিকের জন্য: কোন কর্মচারী কত বিক্রি করল (ফেরতের আগে)
export async function getStaffSales(
  from: string,
  to: string
): Promise<{ name: string; bills: number; total: number }[]> {
  const g = await prisma.sale.groupBy({
    by: ["staffName"],
    where: { status: "CONFIRMED", createdAt: bounds(from, to) },
    _sum: { subtotal: true },
    _count: { _all: true },
    orderBy: { _sum: { subtotal: "desc" } },
  });
  return g.map((x) => ({
    name: x.staffName,
    bills: x._count._all,
    total: r2(x._sum.subtotal),
  }));
}
export type LowStockItem = {
  id: string;
  name: string;
  stock: number;
};

// কম স্টকের চালু পণ্য, সবচেয়ে কম আগে
export async function getLowStockItems(limit: number): Promise<LowStockItem[]> {
  const rows = await prisma.productVariant.findMany({
    where: { stock: { lte: LOW_STOCK_LIMIT }, product: { isActive: true } },
    orderBy: [{ stock: "asc" }, { sku: "asc" }],
    take: limit,
    include: { product: { select: { name: true } } },
  });
  return rows.map((v) => {
    const label = variantLabel(v);
    return {
      id: v.id,
      name: label ? `${v.product.name} (${label})` : v.product.name,
      stock: v.stock,
    };
  });
}