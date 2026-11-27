import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { addDays } from "@/modules/cash/book";

export type SupplierMoneyRow = {
  name: string;
  bought: number;
  paidAtBill: number;
  laterPaid: number;
  cashBack: number;
};

export type MoneyOutReport = {
  from: string;
  to: string;
  paidAtBill: number;
  laterPaid: number;
  expenses: number;
  cashBack: number;
  totalOut: number;
  boughtTotal: number;
  returnedValue: number;
  bySupplier: SupplierMoneyRow[];
  expensesByCategory: { name: string; amount: number }[];
};

type SupAcc = {
  bought: Prisma.Decimal;
  paidAtBill: Prisma.Decimal;
  laterPaid: Prisma.Decimal;
  cashBack: Prisma.Decimal;
};

function r2(n: Prisma.Decimal): number {
  return Math.round(Number(n) * 100) / 100;
}

export async function getMoneyOutReport(params: {
  from: string;
  to: string;
}): Promise<MoneyOutReport> {
  const { from, to } = params;
  const zero = new Prisma.Decimal(0);
  const start = new Date(`${from}T00:00:00+06:00`);
  const end = new Date(`${addDays(to, 1)}T00:00:00+06:00`);
  const range = { gte: start, lt: end };

  const [purchases, purReturns, suppPays, expenses] = await Promise.all([
    prisma.purchase.findMany({
      where: { createdAt: range },
      select: { total: true, paid: true, supplier: { select: { name: true } } },
    }),
    prisma.purchaseReturn.findMany({
      where: { createdAt: range },
      select: {
        total: true,
        cashReceived: true,
        supplier: { select: { name: true } },
      },
    }),
    prisma.supplierPayment.findMany({
      where: { createdAt: range },
      select: { amount: true, supplier: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { voidedAt: null, expenseDate: range },
      select: { amount: true, category: { select: { name: true } } },
    }),
  ]);

  const sup = new Map<string, SupAcc>();
  const get = (name: string): SupAcc => {
    let a = sup.get(name);
    if (!a) {
      a = { bought: zero, paidAtBill: zero, laterPaid: zero, cashBack: zero };
      sup.set(name, a);
    }
    return a;
  };

  let boughtTotal = zero;
  let paidAtBill = zero;
  let laterPaid = zero;
  let cashBack = zero;
  let returnedValue = zero;
  let expensesTotal = zero;

  for (const p of purchases) {
    boughtTotal = boughtTotal.plus(p.total);
    paidAtBill = paidAtBill.plus(p.paid);
    const a = get(p.supplier.name);
    a.bought = a.bought.plus(p.total);
    a.paidAtBill = a.paidAtBill.plus(p.paid);
  }
  for (const r of purReturns) {
    returnedValue = returnedValue.plus(r.total);
    cashBack = cashBack.plus(r.cashReceived);
    const a = get(r.supplier.name);
    a.cashBack = a.cashBack.plus(r.cashReceived);
  }
  for (const p of suppPays) {
    laterPaid = laterPaid.plus(p.amount);
    const a = get(p.supplier.name);
    a.laterPaid = a.laterPaid.plus(p.amount);
  }

  const cat = new Map<string, Prisma.Decimal>();
  for (const e of expenses) {
    expensesTotal = expensesTotal.plus(e.amount);
    cat.set(e.category.name, (cat.get(e.category.name) ?? zero).plus(e.amount));
  }

  const totalOut = paidAtBill.plus(laterPaid).plus(expensesTotal).minus(cashBack);

  return {
    from,
    to,
    paidAtBill: r2(paidAtBill),
    laterPaid: r2(laterPaid),
    expenses: r2(expensesTotal),
    cashBack: r2(cashBack),
    totalOut: r2(totalOut),
    boughtTotal: r2(boughtTotal),
    returnedValue: r2(returnedValue),
    bySupplier: [...sup.entries()]
      .sort((a, b) => b[1].bought.comparedTo(a[1].bought))
      .map(([name, a]) => ({
        name,
        bought: r2(a.bought),
        paidAtBill: r2(a.paidAtBill),
        laterPaid: r2(a.laterPaid),
        cashBack: r2(a.cashBack),
      })),
    expensesByCategory: [...cat.entries()]
      .sort((a, b) => b[1].comparedTo(a[1]))
      .map(([name, amount]) => ({ name, amount: r2(amount) })),
  };
}