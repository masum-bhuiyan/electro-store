import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { addDays, dayKey } from "@/modules/cash/book";
import type { SalesType } from "./range";

export type BelowCostRow = {
  key: string;
  day: string;
  source: "POS" | "ONLINE";
  number: string;
  href: string;
  name: string;
  quantity: number;
  price: number;
  cost: number;
  loss: number;
  staff: string | null;
};

export type BelowCostReport = {
  from: string;
  to: string;
  type: SalesType;
  rows: BelowCostRow[];
  totalLines: number;
  totalLoss: number;
  truncated: boolean;
};

const MAX_ROWS = 300;

function r2(n: Prisma.Decimal): number {
  return Math.round(Number(n) * 100) / 100;
}

export async function getBelowCostReport(params: {
  from: string;
  to: string;
  type: SalesType;
}): Promise<BelowCostReport> {
  const { from, to, type } = params;
  const start = new Date(`${from}T00:00:00+06:00`);
  const end = new Date(`${addDays(to, 1)}T00:00:00+06:00`);
  const range = { gte: start, lt: end };
  const ct = type === "ALL" ? undefined : type;
  const includeOnline = type !== "WHOLESALE";

  const [sales, orders] = await Promise.all([
    prisma.sale.findMany({
      where: { status: "CONFIRMED", createdAt: range, customerType: ct },
      select: {
        id: true,
        saleNumber: true,
        createdAt: true,
        staffName: true,
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unitPrice: true,
            unitCost: true,
          },
        },
      },
    }),
    includeOnline
      ? prisma.order.findMany({
          where: { status: { in: ["SHIPPED", "DELIVERED"] }, shippedAt: range },
          select: {
            id: true,
            orderNumber: true,
            shippedAt: true,
            items: {
              select: {
                id: true,
                name: true,
                quantity: true,
                unitPrice: true,
                unitCost: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const all: (BelowCostRow & { lossDec: Prisma.Decimal })[] = [];

  for (const s of sales) {
    for (const i of s.items) {
      if (i.unitCost === null || !i.unitPrice.lt(i.unitCost)) continue;
      const lossDec = i.unitCost.minus(i.unitPrice).mul(i.quantity);
      all.push({
        key: `s-${i.id}`,
        day: dayKey(s.createdAt),
        source: "POS",
        number: s.saleNumber,
        href: `/admin/sales/${s.id}`,
        name: i.name,
        quantity: i.quantity,
        price: r2(i.unitPrice),
        cost: r2(i.unitCost),
        loss: r2(lossDec),
        staff: s.staffName,
        lossDec,
      });
    }
  }

  for (const o of orders) {
    if (!o.shippedAt) continue;
    for (const i of o.items) {
      if (i.unitCost === null || !i.unitPrice.lt(i.unitCost)) continue;
      const lossDec = i.unitCost.minus(i.unitPrice).mul(i.quantity);
      all.push({
        key: `o-${i.id}`,
        day: dayKey(o.shippedAt),
        source: "ONLINE",
        number: o.orderNumber,
        href: `/admin/orders/${o.id}`,
        name: i.name,
        quantity: i.quantity,
        price: r2(i.unitPrice),
        cost: r2(i.unitCost),
        loss: r2(lossDec),
        staff: null,
        lossDec,
      });
    }
  }

  const totalLoss = all.reduce((s, r) => s.plus(r.lossDec), new Prisma.Decimal(0));
  // সবচেয়ে বেশি লোকসান আগে
  all.sort((a, b) => b.lossDec.comparedTo(a.lossDec));

  return {
    from,
    to,
    type,
    rows: all.slice(0, MAX_ROWS).map(({ lossDec: _l, ...row }) => row),
    totalLines: all.length,
    totalLoss: r2(totalLoss),
    truncated: all.length > MAX_ROWS,
  };
}