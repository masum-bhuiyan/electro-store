import { Prisma } from "@/generated/prisma/client";

// prisma নিজে বা transaction-এর tx, দুটোই চলবে
type Db = Prisma.TransactionClient;

export type CustomerBalance = {
  salesTotal: Prisma.Decimal;
  salesPaid: Prisma.Decimal;
  collected: Prisma.Decimal;
  // ফেরতের মূল্য থেকে ক্রেতার বাকিতে যত কাটা হয়েছে (নগদ ফেরত বাদে)
  returnCredit: Prisma.Decimal;
  // বাকি = বিক্রয়ের মোট − বিক্রির সময়ের পরিশোধ − পরে আদায় − ফেরত থেকে কাটা।
  // ঋণাত্মক = ক্রেতার জমা
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
  const returns = await db.saleReturn.aggregate({
    where: { customerId },
    _sum: { creditAmount: true },
  });

  const salesTotal = sales._sum.subtotal ?? zero;
  const salesPaid = sales._sum.paid ?? zero;
  const collected = pays._sum.amount ?? zero;
  const returnCredit = returns._sum.creditAmount ?? zero;

  return {
    salesTotal,
    salesPaid,
    collected,
    returnCredit,
    balance: salesTotal.minus(salesPaid).minus(collected).minus(returnCredit),
  };
}