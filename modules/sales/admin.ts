import type { Prisma } from "@/generated/prisma/client";
import type { CustomerTypeKey } from "@/lib/customer-type";
import { prisma } from "@/lib/prisma";

export const SALES_PAGE_SIZE = 20;

export type SaleRow = {
  id: string;
  saleNumber: string;
  customerName: string | null;
  customerType: CustomerTypeKey;
  total: number;
  paid: number;
  due: number;
  createdAt: string;
};

export type SaleList = {
  items: SaleRow[];
  total: number;
  page: number;
  totalPages: number;
};

export type SaleDetail = SaleRow & {
  customerId: string | null;
  customerPhone: string | null;
  payMethod: string;
  note: string | null;
  staffName: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    listPrice: number;
    unitPrice: number;
    // কেনা দাম: শুধু costPrice.view থাকলে পাঠানো হয়, নইলে null
    unitCost: number | null;
  }[];
};

export async function getAdminSales(params: {
  q?: string;
  type?: CustomerTypeKey;
  page?: number;
}): Promise<SaleList> {
  const where: Prisma.SaleWhereInput = {};

  if (params.type) where.customerType = params.type;

  const term = params.q?.trim().slice(0, 50);
  if (term) {
    where.OR = [
      { saleNumber: { contains: term, mode: "insensitive" } },
      { customerName: { contains: term, mode: "insensitive" } },
      { customerPhone: { contains: term.replace(/[\s-]/g, "") } },
    ];
  }

  const total = await prisma.sale.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / SALES_PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);

  const rows = await prisma.sale.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * SALES_PAGE_SIZE,
    take: SALES_PAGE_SIZE,
  });

  const items: SaleRow[] = rows.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber,
    customerName: s.customerName,
    customerType: s.customerType,
    total: Number(s.subtotal),
    paid: Number(s.paid),
    due: Number(s.subtotal.minus(s.paid)),
    createdAt: s.createdAt.toISOString(),
  }));

  return { items, total, page, totalPages };
}

export async function getAdminSale(
  id: string,
  includeCost: boolean
): Promise<SaleDetail | null> {
  const s = await prisma.sale.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!s) return null;

  return {
    id: s.id,
    saleNumber: s.saleNumber,
    customerName: s.customerName,
    customerType: s.customerType,
    customerId: s.customerId,
    customerPhone: s.customerPhone,
    total: Number(s.subtotal),
    paid: Number(s.paid),
    due: Number(s.subtotal.minus(s.paid)),
    createdAt: s.createdAt.toISOString(),
    payMethod: s.payMethod,
    note: s.note,
    staffName: s.staffName,
    items: s.items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      listPrice: Number(i.listPrice),
      unitPrice: Number(i.unitPrice),
      unitCost: includeCost && i.unitCost ? Number(i.unitCost) : null,
    })),
  };
}