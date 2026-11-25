import { Prisma } from "@/generated/prisma/client";
import { customerTypeLabel, type CustomerTypeKey } from "@/lib/customer-type";
import { orderStatusLabel } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export type LedgerRow = {
  key: string;
  date: string;
  kind: "OPENING" | "SALE" | "COLLECTION" | "RETURN" | "ONLINE";
  text: string;
  detail: string | null;
  // বাকি বাড়ায় (বিক্রি)
  debit: number;
  // বাকি কমায় (জমা)
  credit: number;
  // এই লাইনের পরের হিসাব। অনলাইন সারিতে null (হিসাবে ধরা হয় না)
  balance: number | null;
  // অনলাইন সারির শুধু তথ্যের মূল্য
  infoAmount: number | null;
};

export type CustomerLedger = {
  customerId: string;
  name: string;
  phone: string;
  typeText: string;
  address: string | null;
  rows: LedgerRow[];
  finalBalance: number;
};

function r2(n: Prisma.Decimal): number {
  return Math.round(Number(n) * 100) / 100;
}

type Raw = Omit<LedgerRow, "balance"> & { sortAt: number; delta: Prisma.Decimal | null };

export async function getCustomerLedger(id: string): Promise<CustomerLedger | null> {
  const c = await prisma.customer.findUnique({ where: { id } });
  if (!c) return null;

  const [sales, pays, returns, orders] = await Promise.all([
    prisma.sale.findMany({
      where: { customerId: id, status: "CONFIRMED" },
      select: { id: true, saleNumber: true, subtotal: true, paid: true, createdAt: true },
    }),
    prisma.customerPayment.findMany({ where: { customerId: id } }),
    prisma.saleReturn.findMany({
      where: { customerId: id },
      include: { sale: { select: { saleNumber: true } } },
    }),
    prisma.order.findMany({
      where: { phone: c.phone },
      select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
    }),
  ]);

  const raws: Raw[] = [];

  for (const s of sales) {
    const due = s.subtotal.minus(s.paid);
    raws.push({
      key: `s-${s.id}`,
      date: s.createdAt.toISOString(),
      sortAt: s.createdAt.getTime(),
      kind: "SALE",
      text: `দোকানের বিক্রি ${s.saleNumber}`,
      detail: s.paid.gt(0) ? `বিক্রির সময় দিয়েছেন ৳${r2(s.paid).toLocaleString("en-US")}` : null,
      debit: r2(due),
      credit: 0,
      delta: due,
      infoAmount: null,
    });
  }

  for (const p of pays) {
    raws.push({
      key: `p-${p.id}`,
      date: p.createdAt.toISOString(),
      sortAt: p.createdAt.getTime(),
      kind: "COLLECTION",
      text: `আদায় ${p.paymentNumber}`,
      detail: null,
      debit: 0,
      credit: r2(p.amount),
      delta: p.amount.negated(),
      infoAmount: null,
    });
  }

  for (const r of returns) {
    raws.push({
      key: `r-${r.id}`,
      date: r.createdAt.toISOString(),
      sortAt: r.createdAt.getTime(),
      kind: "RETURN",
      text: `মাল ফেরত ${r.returnNumber} (${r.sale.saleNumber})`,
      detail: r.cashRefund.gt(0)
        ? `নগদ ফেরত ৳${r2(r.cashRefund).toLocaleString("en-US")} (হিসাবে প্রভাব নেই)`
        : null,
      debit: 0,
      credit: r2(r.creditAmount),
      delta: r.creditAmount.negated(),
      infoAmount: null,
    });
  }

  for (const o of orders) {
    raws.push({
      key: `o-${o.id}`,
      date: o.createdAt.toISOString(),
      sortAt: o.createdAt.getTime(),
      kind: "ONLINE",
      text: `অনলাইন অর্ডার ${o.orderNumber}`,
      detail: `অবস্থা: ${orderStatusLabel(o.status)} (বাকির হিসাবে ধরা হয় না)`,
      debit: 0,
      credit: 0,
      delta: null,
      infoAmount: r2(o.total),
    });
  }

  raws.sort((a, b) => a.sortAt - b.sortAt || a.key.localeCompare(b.key));

  const rows: LedgerRow[] = [];
  let running = c.openingBalance;

  // পুরনো বাকি সবসময় একদম উপরে
  if (c.openingSetAt) {
    rows.push({
      key: "opening",
      date: c.openingSetAt.toISOString(),
      kind: "OPENING",
      text: "পুরনো বাকি (চালুর সময়ের)",
      detail: null,
      debit: c.openingBalance.gt(0) ? r2(c.openingBalance) : 0,
      credit: c.openingBalance.lt(0) ? r2(c.openingBalance.negated()) : 0,
      balance: r2(running),
      infoAmount: null,
    });
  }

  for (const x of raws) {
    if (x.delta) running = running.plus(x.delta);
    const { sortAt, delta, ...rest } = x;
    void sortAt;
    void delta;
    rows.push({ ...rest, balance: x.delta ? r2(running) : null });
  }

  return {
    customerId: c.id,
    name: c.name,
    phone: c.phone,
    typeText: customerTypeLabel(c.type as CustomerTypeKey),
    address: c.address,
    rows,
    finalBalance: r2(running),
  };
}