import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const SUPPLIERS_PAGE_SIZE = 20;

export type AdminSupplier = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  address: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: string;
};

export type AdminSupplierList = {
  items: AdminSupplier[];
  total: number;
  page: number;
  totalPages: number;
};

function toRow(s: {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  address: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: Date;
}): AdminSupplier {
  return { ...s, createdAt: s.createdAt.toISOString() };
}

export async function getAdminSuppliers(params: {
  q?: string;
  page?: number;
}): Promise<AdminSupplierList> {
  const where: Prisma.SupplierWhereInput = {};

  const term = params.q?.trim().slice(0, 50);
  if (term) {
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { contactName: { contains: term, mode: "insensitive" } },
      { phone: { contains: term.replace(/[\s-]/g, "") } },
    ];
  }

  const total = await prisma.supplier.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / SUPPLIERS_PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);

  const rows = await prisma.supplier.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * SUPPLIERS_PAGE_SIZE,
    take: SUPPLIERS_PAGE_SIZE,
  });

  return { items: rows.map(toRow), total, page, totalPages };
}

export async function getAdminSupplier(
  id: string
): Promise<AdminSupplier | null> {
  const s = await prisma.supplier.findUnique({ where: { id } });
  return s ? toRow(s) : null;
}