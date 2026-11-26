import { Prisma } from "@/generated/prisma/client";
import { CASH_KIND_LABELS } from "@/lib/cash-kind";
import { prisma } from "@/lib/prisma";
import {
  SALE_PAY_LABELS,
  SALE_PAY_METHODS,
  type SalePayMethodKey,
} from "@/modules/sales/validation";

// ঢাকার তারিখ (YYYY-MM-DD)
export function dayKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

export function addDays(date: string, n: number): string {
  const t = new Date(`${date}T00:00:00+06:00`).getTime() + n * 86_400_000;
  return dayKey(new Date(t));
}

type Ev = {
  key: string;
  day: string;
  sortAt: number;
  method: SalePayMethodKey;
  delta: Prisma.Decimal;
  text: string;
  detail: string | null;
  href: string | null;
  staff: string | null;
  assumedCash: boolean;
};

export type CashbookCard = {
  method: SalePayMethodKey;
  label: string;
  openingSet: boolean;
  notStarted: boolean;
  before: number;
  moneyIn: number;
  moneyOut: number;
  closing: number;
};

export type CashbookRow = {
  key: string;
  time: string;
  text: string;
  detail: string | null;
  href: string | null;
  methodLabel: string;
  moneyIn: number;
  moneyOut: number;
  staff: string | null;
  assumedCash: boolean;
};

export type Cashbook = {
  date: string;
  cards: CashbookCard[];
  totalClosing: number;
  rows: CashbookRow[];
};

function r2(n: Prisma.Decimal): number {
  return Math.round(Number(n) * 100) / 100;
}

export async function getCashbook(date: string): Promise<Cashbook> {
  const zero = new Prisma.Decimal(0);
  const end = new Date(`${addDays(date, 1)}T00:00:00+06:00`);

  const [sales, custPays, suppPays, purchases, purReturns, saleReturns, expenses, entries] =
    await Promise.all([
      prisma.sale.findMany({
        where: { status: "CONFIRMED", paid: { gt: 0 }, createdAt: { lt: end } },
        select: {
          id: true,
          saleNumber: true,
          customerName: true,
          paid: true,
          payMethod: true,
          staffName: true,
          createdAt: true,
        },
      }),
      prisma.customerPayment.findMany({
        where: { createdAt: { lt: end } },
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          method: true,
          staffName: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
      }),
      prisma.supplierPayment.findMany({
        where: { createdAt: { lt: end } },
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          method: true,
          staffName: true,
          createdAt: true,
          supplier: { select: { name: true } },
        },
      }),
      prisma.purchase.findMany({
        where: { paid: { gt: 0 }, createdAt: { lt: end } },
        select: {
          id: true,
          purchaseNumber: true,
          paid: true,
          staffName: true,
          createdAt: true,
          supplier: { select: { name: true } },
        },
      }),
      prisma.purchaseReturn.findMany({
        where: { cashReceived: { gt: 0 }, createdAt: { lt: end } },
        select: {
          id: true,
          returnNumber: true,
          purchaseId: true,
          cashReceived: true,
          staffName: true,
          createdAt: true,
          supplier: { select: { name: true } },
        },
      }),
      prisma.saleReturn.findMany({
        where: { cashRefund: { gt: 0 }, createdAt: { lt: end } },
        select: {
          id: true,
          returnNumber: true,
          cashRefund: true,
          staffName: true,
          createdAt: true,
          sale: { select: { saleNumber: true, customerName: true } },
        },
      }),
      prisma.expense.findMany({
        where: { voidedAt: null, expenseDate: { lt: end } },
        select: {
          id: true,
          expenseNumber: true,
          amount: true,
          method: true,
          expenseDate: true,
          note: true,
          staffName: true,
          createdAt: true,
          category: { select: { name: true } },
        },
      }),
      prisma.cashEntry.findMany({
        where: { voidedAt: null, entryDate: { lt: end } },
        select: {
          id: true,
          entryNumber: true,
          kind: true,
          method: true,
          toMethod: true,
          amount: true,
          entryDate: true,
          note: true,
          staffName: true,
          createdAt: true,
        },
      }),
    ]);

  const evs: Ev[] = [];
  const label = (m: string) => SALE_PAY_LABELS[m as SalePayMethodKey] ?? m;

  for (const s of sales) {
    evs.push({
      key: `s-${s.id}`,
      day: dayKey(s.createdAt),
      sortAt: s.createdAt.getTime(),
      method: s.payMethod,
      delta: s.paid,
      text: `বিক্রি ${s.saleNumber}`,
      detail: s.customerName,
      href: `/admin/sales/${s.id}`,
      staff: s.staffName,
      assumedCash: false,
    });
  }
  for (const p of custPays) {
    evs.push({
      key: `cp-${p.id}`,
      day: dayKey(p.createdAt),
      sortAt: p.createdAt.getTime(),
      method: p.method,
      delta: p.amount,
      text: `বাকি আদায় ${p.paymentNumber}`,
      detail: p.customer.name,
      href: `/admin/print/receipt/${p.id}`,
      staff: p.staffName,
      assumedCash: false,
    });
  }
  for (const p of suppPays) {
    evs.push({
      key: `sp-${p.id}`,
      day: dayKey(p.createdAt),
      sortAt: p.createdAt.getTime(),
      method: p.method,
      delta: p.amount.negated(),
      text: `সাপ্লায়ারকে পেমেন্ট ${p.paymentNumber}`,
      detail: p.supplier.name,
      href: `/admin/print/voucher/${p.id}`,
      staff: p.staffName,
      assumedCash: false,
    });
  }
  for (const p of purchases) {
    evs.push({
      key: `pu-${p.id}`,
      day: dayKey(p.createdAt),
      sortAt: p.createdAt.getTime(),
      method: "CASH",
      delta: p.paid.negated(),
      text: `ক্রয়ের পরিশোধ ${p.purchaseNumber}`,
      detail: p.supplier.name,
      href: `/admin/purchases/${p.id}`,
      staff: p.staffName,
      assumedCash: true,
    });
  }
  for (const r of purReturns) {
    evs.push({
      key: `pr-${r.id}`,
      day: dayKey(r.createdAt),
      sortAt: r.createdAt.getTime(),
      method: "CASH",
      delta: r.cashReceived,
      text: `সাপ্লায়ারের নগদ ফেরত ${r.returnNumber}`,
      detail: r.supplier.name,
      href: `/admin/purchases/${r.purchaseId}`,
      staff: r.staffName,
      assumedCash: true,
    });
  }
  for (const r of saleReturns) {
    evs.push({
      key: `sr-${r.id}`,
      day: dayKey(r.createdAt),
      sortAt: r.createdAt.getTime(),
      method: "CASH",
      delta: r.cashRefund.negated(),
      text: `ক্রেতাকে নগদ ফেরত ${r.returnNumber}`,
      detail: `${r.sale.saleNumber}${r.sale.customerName ? ` · ${r.sale.customerName}` : ""}`,
      href: `/admin/print/sale-return/${r.id}`,
      staff: r.staffName,
      assumedCash: true,
    });
  }
  for (const e of expenses) {
    evs.push({
      key: `ex-${e.id}`,
      day: dayKey(e.expenseDate),
      sortAt: e.createdAt.getTime(),
      method: e.method,
      delta: e.amount.negated(),
      text: `খরচ: ${e.category.name}`,
      detail: e.note ? `${e.expenseNumber} · ${e.note}` : e.expenseNumber,
      href: "/admin/expenses",
      staff: e.staffName,
      assumedCash: false,
    });
  }
  for (const c of entries) {
    const day = dayKey(c.entryDate);
    const base = {
      day,
      sortAt: c.createdAt.getTime(),
      href: "/admin/cash",
      staff: c.staffName,
      assumedCash: false,
    };
    if (c.kind === "TRANSFER" && c.toMethod) {
      const text = `স্থানান্তর ${label(c.method)} → ${label(c.toMethod)}`;
      const detail = c.note ? `${c.entryNumber} · ${c.note}` : c.entryNumber;
      evs.push({ ...base, key: `ce-${c.id}-a`, method: c.method, delta: c.amount.negated(), text, detail });
      evs.push({ ...base, key: `ce-${c.id}-b`, method: c.toMethod, delta: c.amount, text, detail });
    } else {
      const inflow = c.kind === "OPENING" || c.kind === "DEPOSIT";
      evs.push({
        ...base,
        key: `ce-${c.id}`,
        method: c.method,
        delta: inflow ? c.amount : c.amount.negated(),
        text: CASH_KIND_LABELS[c.kind],
        detail: c.note ? `${c.entryNumber} · ${c.note}` : c.entryNumber,
      });
    }
  }

  // কোন মাধ্যমে কোন দিন থেকে গোনা শুরু
  const startDay = new Map<SalePayMethodKey, string>();
  for (const c of entries) {
    if (c.kind === "OPENING") startDay.set(c.method, dayKey(c.entryDate));
  }

  const cards: CashbookCard[] = [];
  const dayEvents: (Ev & { methodLabel: string })[] = [];

  for (const m of SALE_PAY_METHODS) {
    const start = startDay.get(m) ?? null;
    const notStarted = start !== null && date < start;
    let before = zero;
    let moneyIn = zero;
    let moneyOut = zero;

    if (!notStarted) {
      for (const e of evs) {
        if (e.method !== m) continue;
        if (start !== null && e.day < start) continue;
        if (e.day > date) continue;
        if (e.day < date) {
          before = before.plus(e.delta);
        } else {
          if (e.delta.gt(0)) moneyIn = moneyIn.plus(e.delta);
          else moneyOut = moneyOut.plus(e.delta.negated());
          dayEvents.push({ ...e, methodLabel: label(m) });
        }
      }
    }

    cards.push({
      method: m,
      label: label(m),
      openingSet: start !== null,
      notStarted,
      before: r2(before),
      moneyIn: r2(moneyIn),
      moneyOut: r2(moneyOut),
      closing: r2(before.plus(moneyIn).minus(moneyOut)),
    });
  }

  dayEvents.sort((a, b) => a.sortAt - b.sortAt || a.key.localeCompare(b.key));

  return {
    date,
    cards,
    totalClosing: Math.round(cards.reduce((s, c) => s + c.closing, 0) * 100) / 100,
    rows: dayEvents.map((e) => ({
      key: e.key,
      time: new Date(e.sortAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Dhaka",
      }),
      text: e.text,
      detail: e.detail,
      href: e.href,
      methodLabel: e.methodLabel,
      moneyIn: e.delta.gt(0) ? r2(e.delta) : 0,
      moneyOut: e.delta.lt(0) ? r2(e.delta.negated()) : 0,
      staff: e.staff,
      assumedCash: e.assumedCash,
    })),
  };
}