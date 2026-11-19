import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const PURCHASES_PAGE_SIZE = 20;

export type SupplierOption = { id: string; name: string };

export async function getSupplierOptions(): Promise<SupplierOption[]> {
  return prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export type PurchaseRow = {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  billNo: string | null;
  total: number;
  paid: number;
  due: number;
  createdAt: string;
};

export type PurchaseList = {
  items: PurchaseRow[];
  total: number;
  page: number;
  totalPages: number;
};

export type PurchaseDetail = PurchaseRow & {
  supplierId: string;
  note: string | null;
  staffName: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitCost: number;
    oldPrice: number | null;
    newPrice: number | null;
  }[];
};

export async function getAdminPurchases(params: {
  q?: string;
  page?: number;
}): Promise<PurchaseList> {
  const where: Prisma.PurchaseWhereInput = {};

  const term = params.q?.trim().slice(0, 50);
  if (term) {
    where.OR = [
      { purchaseNumber: { contains: term, mode: "insensitive" } },
      { billNo: { contains: term, mode: "insensitive" } },
      { supplier: { name: { contains: term, mode: "insensitive" } } },
    ];
  }

  const total = await prisma.purchase.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PURCHASES_PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);

  const rows = await prisma.purchase.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * PURCHASES_PAGE_SIZE,
    take: PURCHASES_PAGE_SIZE,
    include: { supplier: { select: { name: true } } },
  });

  const items: PurchaseRow[] = rows.map((p) => ({
    id: p.id,
    purchaseNumber: p.purchaseNumber,
    supplierName: p.supplier.name,
    billNo: p.billNo,
    total: Number(p.total),
    paid: Number(p.paid),
    due: Number(p.total.minus(p.paid)),
    createdAt: p.createdAt.toISOString(),
  }));

  return { items, total, page, totalPages };
}

export async function getAdminPurchase(
  id: string
): Promise<PurchaseDetail | null> {
  const p = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: { select: { name: true } },
      items: { orderBy: { id: "asc" } },
    },
  });
  if (!p) return null;

  return {
    id: p.id,
    purchaseNumber: p.purchaseNumber,
    supplierId: p.supplierId,
    supplierName: p.supplier.name,
    billNo: p.billNo,
    total: Number(p.total),
    paid: Number(p.paid),
    due: Number(p.total.minus(p.paid)),
    createdAt: p.createdAt.toISOString(),
    note: p.note,
    staffName: p.staffName,
    items: p.items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      unitCost: Number(i.unitCost),
      oldPrice: i.oldPrice ? Number(i.oldPrice) : null,
      newPrice: i.newPrice ? Number(i.newPrice) : null,
    })),
  };
}