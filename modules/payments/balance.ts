import { Prisma } from "@/generated/prisma/client";

// prisma নিজে বা transaction-এর tx, দুটোই চলবে
type Db = Prisma.TransactionClient;

export type CustomerBalance = {
  // চালুর সময়ের পুরনো বাকি (ঋণাত্মক = ক্রেতার জমা)
  opening: Prisma.Decimal;
  salesTotal: Prisma.Decimal;
  salesPaid: Prisma.Decimal;
  collected: Prisma.Decimal;
  // ফেরতের মূল্য থেকে ক্রেতার বাকিতে যত কাটা হয়েছে (নগদ ফেরত বাদে)
  returnCredit: Prisma.Decimal;
  // বাকি = পুরনো বাকি + বিক্রয়ের মোট − বিক্রির সময়ের পরিশোধ − পরে আদায় − ফেরত থেকে কাটা।
  // ঋণাত্মক = ক্রেতার জমা
  balance: Prisma.Decimal;
};

export async function getCustomerBalance(
  db: Db,
  customerId: string
): Promise<CustomerBalance> {
  const zero = new Prisma.Decimal(0);

  const cust = await db.customer.findUnique({
    where: { id: customerId },
    select: { openingBalance: true },
  });
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

  const opening = cust?.openingBalance ?? zero;
  const salesTotal = sales._sum.subtotal ?? zero;
  const salesPaid = sales._sum.paid ?? zero;
  const collected = pays._sum.amount ?? zero;
  const returnCredit = returns._sum.creditAmount ?? zero;

  return {
    opening,
    salesTotal,
    salesPaid,
    collected,
    returnCredit,
    balance: opening
      .plus(salesTotal)
      .minus(salesPaid)
      .minus(collected)
      .minus(returnCredit),
  };
}