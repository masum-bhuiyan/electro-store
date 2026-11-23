import { Prisma } from "@/generated/prisma/client";

// prisma নিজে বা transaction-এর tx, দুটোই চলবে
type Db = Prisma.TransactionClient;

export type CustomerBalance = {
  salesTotal: Prisma.Decimal;
  salesPaid: Prisma.Decimal;
  collected: Prisma.Decimal;
  // বাকি = বিক্রয়ের মোট − বিক্রির সময়ের পরিশোধ − পরে আদায়। ঋণাত্মক = ক্রেতার জমা
  balance: Prisma.Decimal;
};

export async function getCustomerBalance(
  db: Db,
  customerId: string
): Promise<CustomerBalance> {
  const zero = new Prisma.Decimal(0);

  const sales = await db.sale.aggregate({
    where: { customerId, status: "CONFIRMED" },
    _sum: { subtotal: true, paid: true },
  });
  const pays = await db.customerPayment.aggregate({
    where: { customerId },
    _sum: { amount: true },
  });

  const salesTotal = sales._sum.subtotal ?? zero;
  const salesPaid = sales._sum.paid ?? zero;
  const collected = pays._sum.amount ?? zero;

  return {
    salesTotal,
    salesPaid,
    collected,
    balance: salesTotal.minus(salesPaid).minus(collected),
  };
}