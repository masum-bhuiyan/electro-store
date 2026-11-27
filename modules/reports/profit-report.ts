import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { addDays, dayKey } from "@/modules/cash/book";
import type { SalesType } from "./range";

export type ProfitDayRow = {
  day: string;
  pos: number;
  online: number;
  returns: number;
  expenses: number;
  net: number;
};

export type ProfitReport = {
  from: string;
  to: string;
  type: SalesType;
  rows: ProfitDayRow[];
  posProfit: number; // দোকানের লাইনের লাভ (অতিরিক্ত ছাড়ের আগে)
  extraDiscount: number;
  onlineProfit: number;
  returnsProfit: number; // ফেরত মালের লাভ (বাদ যাবে)
  grossProfit: number;
  expensesTotal: number | null; // ক্রেতার ধরন ফিল্টারে খরচ ধরা হয় না
  netProfit: number | null;
  expensesByCategory: { name: string; amount: number }[];
  uncosted: { lines: number; value: number };
};

type Acc = {
  pos: Prisma.Decimal;
  online: Prisma.Decimal;
  returns: Prisma.Decimal;
  expenses: Prisma.Decimal;
};

function r2(n: Prisma.Decimal): number {
  return Math.round(Number(n) * 100) / 100;
}

export async function getProfitReport(params: {
  from: string;
  to: string;
  type: SalesType;
}): Promise<ProfitReport> {
  const { from, to, type } = params;
  const zero = new Prisma.Decimal(0);
  const start = new Date(`${from}T00:00:00+06:00`);
  const end = new Date(`${addDays(to, 1)}T00:00:00+06:00`);
  const range = { gte: start, lt: end };

  const ct = type === "ALL" ? undefined : type;
  // অনলাইন অর্ডার সব খুচরা ধরা হয়
  const includeOnline = type !== "WHOLESALE";
  // খরচ খুচরা/পাইকারিতে ভাগ করা যায় না, তাই শুধু "সব" ফিল্টারে ধরা হয়
  const includeExpenses = type === "ALL";

  const [sales, returns, orders, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { status: "CONFIRMED", createdAt: range, customerType: ct },
      select: {
        createdAt: true,
        extraDiscount: true,
        items: { select: { quantity: true, unitPrice: true, unitCost: true } },
      },
    }),
    prisma.saleReturn.findMany({
      where: {
        createdAt: range,
        sale: ct ? { customerType: ct } : undefined,
      },
      select: {
        createdAt: true,
        items: { select: { quantity: true, unitCost: true, amount: true } },
      },
    }),
    includeOnline
      ? prisma.order.findMany({
          where: { status: { in: ["SHIPPED", "DELIVERED"] }, shippedAt: range },
          select: {
            shippedAt: true,
            items: {
              select: { quantity: true, unitPrice: true, unitCost: true },
            },
          },
        })
      : Promise.resolve([]),
    includeExpenses
      ? prisma.expense.findMany({
          where: { voidedAt: null, expenseDate: range },
          select: {
            expenseDate: true,
            amount: true,
            category: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const map = new Map<string, Acc>();
  const acc = (day: string): Acc => {
    let a = map.get(day);
    if (!a) {
      a = { pos: zero, online: zero, returns: zero, expenses: zero };
      map.set(day, a);
    }
    return a;
  };

  let posProfit = zero;
  let extraDiscount = zero;
  let onlineProfit = zero;
  let returnsProfit = zero;
  let expensesTotal = zero;
  let uncostedLines = 0;
  let uncostedValue = zero;

  // কেনা দাম আছে এমন লাইনের লাভ। না থাকলে হিসাবের বাইরে রেখে আলাদা গুনি
  function linesProfit(
    items: {
      quantity: number;
      unitPrice: Prisma.Decimal;
      unitCost: Prisma.Decimal | null;
    }[]
  ): Prisma.Decimal {
    let p = zero;
    for (const i of items) {
      if (i.unitCost === null) {
        uncostedLines += 1;
        uncostedValue = uncostedValue.plus(i.unitPrice.mul(i.quantity));
        continue;
      }
      p = p.plus(i.unitPrice.minus(i.unitCost).mul(i.quantity));
    }
    return p;
  }

  for (const s of sales) {
    const p = linesProfit(s.items);
    posProfit = posProfit.plus(p);
    extraDiscount = extraDiscount.plus(s.extraDiscount);
    const a = acc(dayKey(s.createdAt));
    a.pos = a.pos.plus(p).minus(s.extraDiscount);
  }

  for (const o of orders) {
    if (!o.shippedAt) continue;
    const p = linesProfit(o.items);
    onlineProfit = onlineProfit.plus(p);
    const a = acc(dayKey(o.shippedAt));
    a.online = a.online.plus(p);
  }

  for (const r of returns) {
    // ফেরতের লাভ = ফেরতের মূল্য (ছাড়ের অনুপাতে কমানো) − কেনা দাম
    let p = zero;
    for (const i of r.items) {
      if (i.unitCost === null) continue;
      p = p.plus(i.amount.minus(i.unitCost.mul(i.quantity)));
    }
    returnsProfit = returnsProfit.plus(p);
    const a = acc(dayKey(r.createdAt));
    a.returns = a.returns.plus(p);
  }

  const catMap = new Map<string, Prisma.Decimal>();
  for (const e of expenses) {
    expensesTotal = expensesTotal.plus(e.amount);
    const a = acc(dayKey(e.expenseDate));
    a.expenses = a.expenses.plus(e.amount);
    catMap.set(
      e.category.name,
      (catMap.get(e.category.name) ?? zero).plus(e.amount)
    );
  }

  const rows: ProfitDayRow[] = [...map.entries()]
    .sort((x, y) => (x[0] < y[0] ? -1 : 1))
    .map(([day, a]) => ({
      day,
      pos: r2(a.pos),
      online: r2(a.online),
      returns: r2(a.returns),
      expenses: r2(a.expenses),
      net: r2(a.pos.plus(a.online).minus(a.returns).minus(a.expenses)),
    }));

  const gross = posProfit.minus(extraDiscount).plus(onlineProfit).minus(returnsProfit);

  return {
    from,
    to,
    type,
    rows,
    posProfit: r2(posProfit),
    extraDiscount: r2(extraDiscount),
    onlineProfit: r2(onlineProfit),
    returnsProfit: r2(returnsProfit),
    grossProfit: r2(gross),
    expensesTotal: includeExpenses ? r2(expensesTotal) : null,
    netProfit: includeExpenses ? r2(gross.minus(expensesTotal)) : null,
    expensesByCategory: [...catMap.entries()]
      .sort((a, b) => b[1].comparedTo(a[1]))
      .map(([name, amount]) => ({ name, amount: r2(amount) })),
    uncosted: { lines: uncostedLines, value: r2(uncostedValue) },
  };
}