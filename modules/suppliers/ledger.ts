import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type SupplierLedgerRow = {
  key: string;
  date: string;
  kind: "OPENING" | "PURCHASE" | "RETURN" | "PAYMENT";
  text: string;
  detail: string | null;
  // বাকি বাড়ায় (আমরা বেশি দেব)
  debit: number;
  // বাকি কমায়
  credit: number;
  balance: number;
};

export type SupplierLedger = {
  supplierId: string;
  name: string;
  phone: string | null;
  address: string | null;
  rows: SupplierLedgerRow[];
  finalBalance: number;
};

function r2(n: Prisma.Decimal): number {
  return Math.round(Number(n) * 100) / 100;
}

type Raw = {
  key: string;
  date: string;
  sortAt: number;
  kind: "PURCHASE" | "RETURN" | "PAYMENT";
  text: string;
  detail: string | null;
  delta: Prisma.Decimal;
};

export async function getSupplierLedger(
  id: string
): Promise<SupplierLedger | null> {
  const s = await prisma.supplier.findUnique({ where: { id } });
  if (!s) return null;

  const [purchases, returns, payments] = await Promise.all([
    prisma.purchase.findMany({
      where: { supplierId: id },
      select: {
        id: true,
        purchaseNumber: true,
        billNo: true,
        total: true,
        paid: true,
        createdAt: true,
      },
    }),
    prisma.purchaseReturn.findMany({
      where: { supplierId: id },
      select: {
        id: true,
        returnNumber: true,
        total: true,
        cashReceived: true,
        createdAt: true,
        purchase: { select: { purchaseNumber: true } },
      },
    }),
    prisma.supplierPayment.findMany({
      where: { supplierId: id },
      select: {
        id: true,
        paymentNumber: true,
        amount: true,
        createdAt: true,
      },
    }),
  ]);

  const raws: Raw[] = [];

  for (const p of purchases) {
    const due = p.total.minus(p.paid);
    raws.push({
      key: `pu-${p.id}`,
      date: p.createdAt.toISOString(),
      sortAt: p.createdAt.getTime(),
      kind: "PURCHASE",
      text: `মাল কেনা ${p.purchaseNumber}${p.billNo ? ` (বিল: ${p.billNo})` : ""}`,
      detail: `মোট ৳${r2(p.total).toLocaleString("en-US")}${
        p.paid.gt(0)
          ? `, বিলের সময় দিয়েছেন ৳${r2(p.paid).toLocaleString("en-US")}`
          : ""
      }`,
      delta: due,
    });
  }

  for (const r of returns) {
    // ফেরত মালের মূল্য বাকি কমায়, সাপ্লায়ার নগদ ফেরত দিলে সেটা আবার বাকি বাড়ায়
    raws.push({
      key: `re-${r.id}`,
      date: r.createdAt.toISOString(),
      sortAt: r.createdAt.getTime(),
      kind: "RETURN",
      text: `মাল ফেরত ${r.returnNumber} (${r.purchase.purchaseNumber})`,
      detail: r.cashReceived.gt(0)
        ? `মাল ৳${r2(r.total).toLocaleString("en-US")}, নগদ ফেরত পেয়েছেন ৳${r2(
            r.cashReceived
          ).toLocaleString("en-US")}`
        : null,
      delta: r.total.negated().plus(r.cashReceived),
    });
  }

  for (const p of payments) {
    raws.push({
      key: `pa-${p.id}`,
      date: p.createdAt.toISOString(),
      sortAt: p.createdAt.getTime(),
      kind: "PAYMENT",
      text: `পেমেন্ট ${p.paymentNumber}`,
      detail: null,
      delta: p.amount.negated(),
    });
  }

  raws.sort((a, b) => a.sortAt - b.sortAt || a.key.localeCompare(b.key));

  const rows: SupplierLedgerRow[] = [];
  let running = s.openingBalance;

  // পুরনো বাকি সবসময় একদম উপরে
  if (s.openingSetAt) {
    rows.push({
      key: "opening",
      date: s.openingSetAt.toISOString(),
      kind: "OPENING",
      text: "পুরনো বাকি (চালুর সময়ের)",
      detail: null,
      debit: s.openingBalance.gt(0) ? r2(s.openingBalance) : 0,
      credit: s.openingBalance.lt(0) ? r2(s.openingBalance.negated()) : 0,
      balance: r2(running),
    });
  }

  for (const x of raws) {
    running = running.plus(x.delta);
    rows.push({
      key: x.key,
      date: x.date,
      kind: x.kind,
      text: x.text,
      detail: x.detail,
      debit: x.delta.gt(0) ? r2(x.delta) : 0,
      credit: x.delta.lt(0) ? r2(x.delta.negated()) : 0,
      balance: r2(running),
    });
  }

  return {
    supplierId: s.id,
    name: s.name,
    phone: s.phone,
    address: s.address,
    rows,
    finalBalance: r2(running),
  };
}