import { prisma } from "@/lib/prisma";
import { SALE_PAY_LABELS, type SalePayMethodKey } from "@/modules/sales/validation";

export type SupplierVoucher = {
  id: string;
  paymentNumber: string;
  createdAt: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string | null;
  amount: number;
  methodLabel: string;
  balanceBefore: number;
  balanceAfter: number;
  note: string | null;
  staffName: string;
};

export async function getSupplierVoucher(id: string): Promise<SupplierVoucher | null> {
  const p = await prisma.supplierPayment.findUnique({
    where: { id },
    include: { supplier: { select: { id: true, name: true, phone: true } } },
  });
  if (!p) return null;

  return {
    id: p.id,
    paymentNumber: p.paymentNumber,
    createdAt: p.createdAt.toISOString(),
    supplierId: p.supplier.id,
    supplierName: p.supplier.name,
    supplierPhone: p.supplier.phone,
    amount: Number(p.amount),
    methodLabel: SALE_PAY_LABELS[p.method as SalePayMethodKey] ?? p.method,
    balanceBefore: Number(p.balanceBefore),
    balanceAfter: Number(p.balanceAfter),
    note: p.note,
    staffName: p.staffName,
  };
}