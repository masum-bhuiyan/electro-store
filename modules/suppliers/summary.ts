import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { SALE_PAY_LABELS, type SalePayMethodKey } from "@/modules/sales/validation";

export type SupplierSummary = {
  purchaseCount: number;
  // চালুর সময়ের পুরনো বাকি (ঋণাত্মক = সাপ্লায়ার আমাদের দেবে)
  opening: number;
  openingSet: boolean;
  totalBought: number;
  // বিল করার সময় যা দেওয়া হয়েছিল
  totalPaid: number;
  // পরে "টাকা দিন" ফর্ম দিয়ে যা দেওয়া হয়েছে
  laterPaid: number;
  totalReturned: number;
  cashReceived: number;
  // বাকি = কেনা − বিলের সময় পরিশোধ − ফেরতের মূল্য + নগদ ফেরত − পরের পেমেন্ট
  // মাইনাস মানে সাপ্লায়ার আপনাকে দেবে
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
  recentPayments: {
    id: string;
    paymentNumber: string;
    amount: number;
    methodLabel: string;
    balanceAfter: number;
    staffName: string;
    createdAt: string;
  }[];
};

export async function getSupplierSummary(
  supplierId: string
): Promise<SupplierSummary> {
    const [agg, ret, pay, recent, payments, sup] = await Promise.all([
    prisma.purchase.aggregate({
      where: { supplierId },
      _sum: { total: true, paid: true },
      _count: true,
    }),
    prisma.purchaseReturn.aggregate({
      where: { supplierId },
      _sum: { total: true, cashReceived: true },
    }),
    prisma.supplierPayment.aggregate({
      where: { supplierId },
      _sum: { amount: true },
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
    prisma.supplierPayment.findMany({
      where: { supplierId },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 10,
      select: {
        id: true,
        paymentNumber: true,
        amount: true,
        method: true,
        balanceAfter: true,
        staffName: true,
        createdAt: true,
      },
    }),
        prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { openingBalance: true, openingSetAt: true },
    }),
  ]);

  const zero = new Prisma.Decimal(0);
  const total = agg._sum.total ?? zero;
  const paid = agg._sum.paid ?? zero;
  const returned = ret._sum.total ?? zero;
  const cash = ret._sum.cashReceived ?? zero;
  const later = pay._sum.amount ?? zero;
  const opening = sup?.openingBalance ?? zero;

  return {
    purchaseCount: agg._count,
    opening: Number(opening),
    openingSet: sup?.openingSetAt != null,
    totalBought: Number(total),
    totalPaid: Number(paid),
    laterPaid: Number(later),
    totalReturned: Number(returned),
    cashReceived: Number(cash),
    due: Number(opening.plus(total).minus(paid).minus(returned).plus(cash).minus(later)),
    recent: recent.map((p) => ({
      id: p.id,
      purchaseNumber: p.purchaseNumber,
      billNo: p.billNo,
      total: Number(p.total),
      paid: Number(p.paid),
      due: Number(p.total.minus(p.paid)),
      createdAt: p.createdAt.toISOString(),
    })),
    recentPayments: payments.map((p) => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      amount: Number(p.amount),
      methodLabel: SALE_PAY_LABELS[p.method as SalePayMethodKey] ?? p.method,
      balanceAfter: Number(p.balanceAfter),
      staffName: p.staffName,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}