import type { Prisma } from "@/generated/prisma/client";
import type { CustomerTypeKey } from "@/lib/customer-type";
import type { OrderStatusKey } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export const CUSTOMERS_PAGE_SIZE = 20;

export type AdminCustomerRow = {
  id: string;
  type: CustomerTypeKey;
  name: string;
  contactName: string | null;
  phone: string;
  isActive: boolean;
  createdAt: string;
};

export type AdminCustomerList = {
  items: AdminCustomerRow[];
  total: number;
  page: number;
  totalPages: number;
};

export type AdminCustomerDetail = {
  id: string;
  type: CustomerTypeKey;
  name: string;
  contactName: string | null;
  phone: string;
  address: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: string;
  // এই ফোন নম্বরের অনলাইন অর্ডার (বাতিল বাদে মোট কেনা)
  online: { orderCount: number; totalSpent: number };
  recentOrders: {
    id: string;
    orderNumber: string;
    status: OrderStatusKey;
    total: number;
    createdAt: string;
  }[];
  // দোকানের (POS) বিক্রি: এই ক্রেতার রেকর্ডের সাথে যুক্ত বিক্রি
  pos: { saleCount: number; totalBought: number; totalDue: number };
  recentSales: {
    id: string;
    saleNumber: string;
    total: number;
    paid: number;
    due: number;
    createdAt: string;
  }[];
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// প্রতিটা ধরনে কয়জন ক্রেতা (তালিকার ট্যাবের সংখ্যার জন্য)
export async function getCustomerTypeCounts(): Promise<
  Record<CustomerTypeKey, number>
> {
  const rows = await prisma.customer.groupBy({
    by: ["type"],
    _count: { _all: true },
  });
  const counts: Record<CustomerTypeKey, number> = { RETAIL: 0, WHOLESALE: 0 };
  for (const row of rows) counts[row.type] = row._count._all;
  return counts;
}

export async function getAdminCustomers(params: {
  q?: string;
  type?: CustomerTypeKey;
  page?: number;
}): Promise<AdminCustomerList> {
  const where: Prisma.CustomerWhereInput = {};

  if (params.type) where.type = params.type;

  const term = params.q?.trim().slice(0, 50);
  if (term) {
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { contactName: { contains: term, mode: "insensitive" } },
      { phone: { contains: term.replace(/[\s-]/g, "") } },
    ];
  }

  const total = await prisma.customer.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);

  const rows = await prisma.customer.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * CUSTOMERS_PAGE_SIZE,
    take: CUSTOMERS_PAGE_SIZE,
  });

  const items: AdminCustomerRow[] = rows.map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    contactName: c.contactName,
    phone: c.phone,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  }));

  return { items, total, page, totalPages };
}

export async function getAdminCustomer(
  id: string
): Promise<AdminCustomerDetail | null> {
  const c = await prisma.customer.findUnique({ where: { id } });
  if (!c) return null;

  const [agg, recent, saleAgg, recentSales] = await Promise.all([
    prisma.order.aggregate({
      where: { phone: c.phone, status: { not: "CANCELLED" } },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { phone: c.phone },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
      },
    }),
    prisma.sale.aggregate({
            where: { customerId: c.id, status: "CONFIRMED" },
      _count: { _all: true },
      _sum: { subtotal: true, paid: true },
    }),
    prisma.sale.findMany({
            where: { customerId: c.id, status: "CONFIRMED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        saleNumber: true,
        subtotal: true,
        paid: true,
        createdAt: true,
      },
    }),
  ]);

  const posTotal = Number(saleAgg._sum.subtotal ?? 0);
  const posPaid = Number(saleAgg._sum.paid ?? 0);

  return {
    id: c.id,
    type: c.type,
    name: c.name,
    contactName: c.contactName,
    phone: c.phone,
    address: c.address,
    note: c.note,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    online: {
      orderCount: agg._count._all,
      totalSpent: Number(agg._sum.total ?? 0),
    },
    recentOrders: recent.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
    })),
    pos: {
      saleCount: saleAgg._count._all,
      totalBought: round2(posTotal),
      totalDue: round2(posTotal - posPaid),
    },
    recentSales: recentSales.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      total: Number(s.subtotal),
      paid: Number(s.paid),
      due: round2(Number(s.subtotal) - Number(s.paid)),
      createdAt: s.createdAt.toISOString(),
    })),
  };
}