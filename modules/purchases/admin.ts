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

export type PurchaseReturnRow = {
  id: string;
  returnNumber: string;
  total: number;
  cashReceived: number;
  note: string | null;
  staffName: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
};

export type PurchaseDetail = PurchaseRow & {
  supplierId: string;
  note: string | null;
  staffName: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    returned: number;
    unitCost: number;
    oldPrice: number | null;
    newPrice: number | null;
  }[];
  returns: PurchaseReturnRow[];
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
      returns: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });
  if (!p) return null;

  // প্রতিটি লাইনে এ পর্যন্ত কতটি ফেরত গেছে
  const returnedMap = new Map<string, number>();
  for (const r of p.returns) {
    for (const ri of r.items) {
      returnedMap.set(
        ri.purchaseItemId,
        (returnedMap.get(ri.purchaseItemId) ?? 0) + ri.quantity
      );
    }
  }

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
      returned: returnedMap.get(i.id) ?? 0,
      unitCost: Number(i.unitCost),
      oldPrice: i.oldPrice ? Number(i.oldPrice) : null,
      newPrice: i.newPrice ? Number(i.newPrice) : null,
    })),
    returns: p.returns.map((r) => ({
      id: r.id,
      returnNumber: r.returnNumber,
      total: Number(r.total),
      cashReceived: Number(r.cashReceived),
      note: r.note,
      staffName: r.staffName,
      createdAt: r.createdAt.toISOString(),
      items: r.items.map((ri) => ({ name: ri.name, quantity: ri.quantity })),
    })),
  };
}