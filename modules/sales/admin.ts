import type { Prisma } from "@/generated/prisma/client";
import type { CustomerTypeKey } from "@/lib/customer-type";
import { prisma } from "@/lib/prisma";
import type { SaleStatusKey } from "@/modules/sales/validation";
import type { SaleCustomerRow } from "@/modules/sales/search";

export const SALES_PAGE_SIZE = 20;

export type SaleRow = {
  id: string;
  saleNumber: string;
  status: SaleStatusKey;
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
  extraDiscount: number;
  note: string | null;
  staffName: string;
   edits: {
    id: string;
    staffName: string;
    summary: string;
    reason: string | null;
    createdAt: string;
  }[];
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

export async function getDraftCount(): Promise<number> {
  return prisma.sale.count({ where: { status: "DRAFT" } });
}

export async function getAdminSales(params: {
  q?: string;
  type?: CustomerTypeKey;
  status?: SaleStatusKey;
  page?: number;
}): Promise<SaleList> {
  // ডিফল্টে শুধু কনফার্মড বিক্রয়
  const status: SaleStatusKey = params.status ?? "CONFIRMED";
  const where: Prisma.SaleWhereInput = { status };

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
    // ড্রাফটে পুরনোগুলো আগে (রোজ চেকের জন্য), বিক্রয়ে নতুনগুলো আগে
    orderBy: [
      { createdAt: status === "DRAFT" ? "asc" : "desc" },
      { id: "asc" },
    ],
    skip: (page - 1) * SALES_PAGE_SIZE,
    take: SALES_PAGE_SIZE,
  });

  const items: SaleRow[] = rows.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber,
    status: s.status,
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
       include: {
      items: { orderBy: { id: "asc" } },
      edits: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!s) return null;

  return {
    id: s.id,
    saleNumber: s.saleNumber,
    status: s.status,
    customerName: s.customerName,
    customerType: s.customerType,
    customerId: s.customerId,
    customerPhone: s.customerPhone,
    total: Number(s.subtotal),
    paid: Number(s.paid),
    due: Number(s.subtotal.minus(s.paid)),
    createdAt: s.createdAt.toISOString(),
    payMethod: s.payMethod,
    extraDiscount: Number(s.extraDiscount),
    note: s.note,
    staffName: s.staffName,
        edits: s.edits.map((e) => ({
      id: e.id,
      staffName: e.staffName,
      summary: e.summary,
      reason: e.reason,
      createdAt: e.createdAt.toISOString(),
    })),
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
export type DraftEditData = {
  id: string;
  saleNumber: string;
  customer: SaleCustomerRow | null;
  // ফোন ছাড়া শুধু নাম দিয়ে রাখা ড্রাফটের নাম
  looseName: string;
  customerType: CustomerTypeKey;
  payMethod: string;
  paid: number;
  extraDiscount: number;
  note: string;
  items: { variantId: string; quantity: number; unitPrice: number }[];
};

// এডিটের জন্য ড্রাফট লোড। ড্রাফট না হলে null
export async function getDraftForEdit(
  id: string,
  status: SaleStatusKey = "DRAFT"
): Promise<DraftEditData | null> {
  const s = await prisma.sale.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } } },
  });
    if (!s || s.status !== status) return null;

  const customer = s.customerId
    ? await prisma.customer.findUnique({
        where: { id: s.customerId },
        select: { id: true, type: true, name: true, contactName: true, phone: true },
      })
    : null;

  return {
    id: s.id,
    saleNumber: s.saleNumber,
    customer,
    looseName: s.customerId ? "" : s.customerName ?? "",
    customerType: s.customerType,
    payMethod: s.payMethod,
    paid: Number(s.paid),
    extraDiscount: Number(s.extraDiscount),
    note: s.note ?? "",
    items: s.items.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    })),
  };
}