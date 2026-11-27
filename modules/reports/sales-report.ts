import { Prisma } from "@/generated/prisma/client";
import { addDays, dayKey } from "@/modules/cash/book";
import type { SalesType } from "./range";

export type SalesDayRow = {
  day: string;
  posCount: number;
  pos: number;
  onlineCount: number;
  online: number;
  returns: number;
  net: number;
};

export type SalesReport = {
  from: string;
  to: string;
  type: SalesType;
  rows: SalesDayRow[];
  totals: SalesDayRow;
  deliveryCharge: number;
  collections: { count: number; amount: number };
  courierReceived: { count: number; amount: number };
  courierPending: { count: number; amount: number };
};

type Acc = {
  posCount: number;
  pos: Prisma.Decimal;
  onlineCount: number;
  online: Prisma.Decimal;
  returns: Prisma.Decimal;
};

function r2(n: Prisma.Decimal | null | undefined): number {
  return n ? Math.round(Number(n) * 100) / 100 : 0;
}

export async function getSalesReport(params: {
  from: string;
  to: string;
  type: SalesType;
}): Promise<SalesReport> {
  const { from, to, type } = params;
  const zero = new Prisma.Decimal(0);
  const start = new Date(`${from}T00:00:00+06:00`);
  const end = new Date(`${addDays(to, 1)}T00:00:00+06:00`);
  const range = { gte: start, lt: end };

  const typeFilter = type === "ALL" ? undefined : type;
  // অনলাইন অর্ডার সব খুচরা ধরা হয়, তাই পাইকারি ফিল্টারে বাদ
  const includeOnline = type !== "WHOLESALE";

  const [
    sales,
    returns,
    collections,
    orders,
    courierReceived,
    courierPending,
  ] = await Promise.all([
    prisma_sales(range, typeFilter),
    prisma_returns(range, typeFilter),
    prisma_collections(range, typeFilter),
    includeOnline ? prisma_orders(range) : null,
    includeOnline ? prisma_courierReceived(range) : null,
    includeOnline ? prisma_courierPending() : null,
  ]);

  // দিন ধরে হিসাব
  const map = new Map<string, Acc>();
  const acc = (day: string): Acc => {
    let a = map.get(day);
    if (!a) {
      a = { posCount: 0, pos: zero, onlineCount: 0, online: zero, returns: zero };
      map.set(day, a);
    }
    return a;
  };

  for (const s of sales) {
    const a = acc(dayKey(s.createdAt));
    a.posCount += 1;
    a.pos = a.pos.plus(s.subtotal);
  }
  let deliveryCharge = zero;
  for (const o of orders ?? []) {
    if (!o.shippedAt) continue;
    const a = acc(dayKey(o.shippedAt));
    a.onlineCount += 1;
    a.online = a.online.plus(o.subtotal);
    deliveryCharge = deliveryCharge.plus(o.shippingFee);
  }
  for (const r of returns) {
    const a = acc(dayKey(r.createdAt));
    a.returns = a.returns.plus(r.total);
  }

  const rows: SalesDayRow[] = [...map.entries()]
    .sort((x, y) => (x[0] < y[0] ? -1 : 1))
    .map(([day, a]) => ({
      day,
      posCount: a.posCount,
      pos: r2(a.pos),
      onlineCount: a.onlineCount,
      online: r2(a.online),
      returns: r2(a.returns),
      net: r2(a.pos.plus(a.online).minus(a.returns)),
    }));

  const totals: SalesDayRow = rows.reduce(
    (t, r) => ({
      day: "মোট",
      posCount: t.posCount + r.posCount,
      pos: t.pos + r.pos,
      onlineCount: t.onlineCount + r.onlineCount,
      online: t.online + r.online,
      returns: t.returns + r.returns,
      net: t.net + r.net,
    }),
    { day: "মোট", posCount: 0, pos: 0, onlineCount: 0, online: 0, returns: 0, net: 0 }
  );
  for (const k of ["pos", "online", "returns", "net"] as const) {
    totals[k] = Math.round(totals[k] * 100) / 100;
  }

  return {
    from,
    to,
    type,
    rows,
    totals,
    deliveryCharge: r2(deliveryCharge),
    collections: {
      count: collections._count._all,
      amount: r2(collections._sum.amount),
    },
    courierReceived: {
      count: courierReceived?._count._all ?? 0,
      amount: r2(courierReceived?._sum.paidAmount),
    },
    courierPending: {
      count: courierPending?._count._all ?? 0,
      amount: r2(courierPending?._sum.subtotal),
    },
  };
}

// ---- নিচের ছোট কোয়েরিগুলো আলাদা রাখা হয়েছে, যাতে ওপরের কোড পড়তে সহজ থাকে ----
import { prisma } from "@/lib/prisma";

type DateRange = { gte: Date; lt: Date };
type Ct = "RETAIL" | "WHOLESALE" | undefined;

function prisma_sales(range: DateRange, ct: Ct) {
  return prisma.sale.findMany({
    where: { status: "CONFIRMED", createdAt: range, customerType: ct },
    select: { createdAt: true, subtotal: true },
  });
}

function prisma_returns(range: DateRange, ct: Ct) {
  return prisma.saleReturn.findMany({
    where: {
      createdAt: range,
      sale: ct ? { customerType: ct } : undefined,
    },
    select: { createdAt: true, total: true },
  });
}

function prisma_collections(range: DateRange, ct: Ct) {
  return prisma.customerPayment.aggregate({
    where: {
      createdAt: range,
      customer: ct ? { type: ct } : undefined,
    },
    _sum: { amount: true },
    _count: { _all: true },
  });
}

function prisma_orders(range: DateRange) {
  return prisma.order.findMany({
    where: { status: { in: ["SHIPPED", "DELIVERED"] }, shippedAt: range },
    select: { shippedAt: true, subtotal: true, shippingFee: true },
  });
}

function prisma_courierReceived(range: DateRange) {
  return prisma.order.aggregate({
    where: { paymentStatus: "PAID", paidAt: range },
    _sum: { paidAmount: true },
    _count: { _all: true },
  });
}

function prisma_courierPending() {
  return prisma.order.aggregate({
    where: {
      paymentMethod: "COD",
      status: "DELIVERED",
      paymentStatus: { not: "PAID" },
    },
    _sum: { subtotal: true },
    _count: { _all: true },
  });
}