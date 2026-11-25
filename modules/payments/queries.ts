import { Prisma } from "@/generated/prisma/client";
import { customerTypeLabel, type CustomerTypeKey } from "@/lib/customer-type";
import { prisma } from "@/lib/prisma";
import { SALE_PAY_LABELS, type SalePayMethodKey } from "@/modules/sales/validation";

export type ReceiptBill = {
  saleNumber: string;
  createdAt: string;
  total: number;
  dueAtSale: number;
  remaining: number;
};

export type CustomerReceipt = {
  id: string;
  paymentNumber: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerTypeText: string;
  amount: number;
  methodLabel: string;
  balanceBefore: number;
  balanceAfter: number;
  note: string | null;
  staffName: string;
  // withBills = false হলে null
  bills: ReceiptBill[] | null;
};

export async function getCustomerReceipt(
  id: string,
  withBills: boolean
): Promise<CustomerReceipt | null> {
  const p = await prisma.customerPayment.findUnique({
    where: { id },
    include: {
            customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          type: true,
          openingBalance: true,
          openingSetAt: true,
        },
      },
    },
  });
  if (!p) return null;

  let bills: ReceiptBill[] | null = null;
  if (withBills) {
        const [sales, coll, rc] = await Promise.all([
      prisma.sale.findMany({
        where: {
          customerId: p.customerId,
          status: "CONFIRMED",
          createdAt: { lte: p.createdAt },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { saleNumber: true, subtotal: true, paid: true, createdAt: true },
      }),
      prisma.customerPayment.aggregate({
        where: { customerId: p.customerId, createdAt: { lte: p.createdAt } },
        _sum: { amount: true },
      }),
      prisma.saleReturn.aggregate({
        where: { customerId: p.customerId, createdAt: { lte: p.createdAt } },
        _sum: { creditAmount: true },
      }),
    ]);

    // আদায়ের টাকা পুরনো বিল থেকে আগে কাটা ধরা (শুধু দেখানোর হিসাব)
        let pool = (coll._sum.amount ?? new Prisma.Decimal(0)).plus(
      rc._sum.creditAmount ?? new Prisma.Decimal(0)
    );
        bills = [];

    // পুরনো বাকি সবচেয়ে পুরনো, তাই আদায়ের টাকা আগে সেখান থেকে কাটা
    const openingDue = p.customer.openingBalance;
    if (openingDue.gt(0)) {
      const applied = Prisma.Decimal.min(openingDue, pool);
      pool = pool.minus(applied);
      const remainingOpening = openingDue.minus(applied);
      if (remainingOpening.gt(0)) {
        bills.push({
          saleNumber: "পুরনো বাকি (চালুর সময়ের)",
          createdAt: (p.customer.openingSetAt ?? p.createdAt).toISOString(),
          total: Number(openingDue),
          dueAtSale: Number(openingDue),
          remaining: Number(remainingOpening),
        });
      }
    }
  }

  return {
    id: p.id,
    paymentNumber: p.paymentNumber,
    createdAt: p.createdAt.toISOString(),
    customerId: p.customer.id,
    customerName: p.customer.name,
    customerPhone: p.customer.phone,
    customerTypeText: customerTypeLabel(p.customer.type as CustomerTypeKey),
    amount: Number(p.amount),
    methodLabel: SALE_PAY_LABELS[p.method as SalePayMethodKey] ?? p.method,
    balanceBefore: Number(p.balanceBefore),
    balanceAfter: Number(p.balanceAfter),
    note: p.note,
    staffName: p.staffName,
    bills,
  };
}