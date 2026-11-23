import { Prisma } from "@/generated/prisma/client";

// সাপ্লায়ারের বাকি = কেনা − বিলের সময় পরিশোধ − ফেরতের মূল্য + নগদ ফেরত − পরের পেমেন্ট
// ধনাত্মক = আমরা সাপ্লায়ারকে দেব, ঋণাত্মক = সাপ্লায়ার আমাদের দেবে
export async function getSupplierBalance(
  db: Prisma.TransactionClient,
  supplierId: string
): Promise<Prisma.Decimal> {
  const zero = new Prisma.Decimal(0);

  const purchases = await db.purchase.aggregate({
    where: { supplierId },
    _sum: { total: true, paid: true },
  });
  const returns = await db.purchaseReturn.aggregate({
    where: { supplierId },
    _sum: { total: true, cashReceived: true },
  });
  const payments = await db.supplierPayment.aggregate({
    where: { supplierId },
    _sum: { amount: true },
  });

  return (purchases._sum.total ?? zero)
    .minus(purchases._sum.paid ?? zero)
    .minus(returns._sum.total ?? zero)
    .plus(returns._sum.cashReceived ?? zero)
    .minus(payments._sum.amount ?? zero);
}