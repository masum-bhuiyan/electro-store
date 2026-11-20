import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type SupplierSummary = {
  purchaseCount: number;
  totalBought: number;
  totalPaid: number;
  totalReturned: number;
  cashReceived: number;
  // বাকি = কেনা − পরিশোধ − ফেরতের মূল্য + নগদ ফেরত। মাইনাস মানে সাপ্লায়ার আপনাকে দেবে
  due: number;
  recent: {
    id: string;
    purchaseNumber: string;
    billNo: string | null;
    total: number;
    paid: number;
    due: number;
    createdAt: string;
  }[];
};

export async function getSupplierSummary(
  supplierId: string
): Promise<SupplierSummary> {
  const [agg, ret, recent] = await Promise.all([
    prisma.purchase.aggregate({
      where: { supplierId },
      _sum: { total: true, paid: true },
      _count: true,
    }),
    prisma.purchaseReturn.aggregate({
      where: { supplierId },
      _sum: { total: true, cashReceived: true },
    }),
    prisma.purchase.findMany({
      where: { supplierId },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 10,
      select: {
        id: true,
        purchaseNumber: true,
        billNo: true,
        total: true,
        paid: true,
        createdAt: true,
      },
    }),
  ]);

  const zero = new Prisma.Decimal(0);
  const total = agg._sum.total ?? zero;
  const paid = agg._sum.paid ?? zero;
  const returned = ret._sum.total ?? zero;
  const cash = ret._sum.cashReceived ?? zero;

  return {
    purchaseCount: agg._count,
    totalBought: Number(total),
    totalPaid: Number(paid),
    totalReturned: Number(returned),
    cashReceived: Number(cash),
    due: Number(total.minus(paid).minus(returned).plus(cash)),
    recent: recent.map((p) => ({
      id: p.id,
      purchaseNumber: p.purchaseNumber,
      billNo: p.billNo,
      total: Number(p.total),
      paid: Number(p.paid),
      due: Number(p.total.minus(p.paid)),
      createdAt: p.createdAt.toISOString(),
    })),
  };
}