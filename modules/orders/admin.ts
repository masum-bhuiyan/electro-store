import type { Prisma } from "@/generated/prisma/client";
import type {
  OrderStatusKey,
  PaymentMethodKey,
  PaymentStatusKey,
} from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "./validation";

export const ORDERS_PAGE_SIZE = 20;

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  status: OrderStatusKey;
  paymentMethod: PaymentMethodKey;
  paymentStatus: PaymentStatusKey;
  total: number;
  itemCount: number;
  createdAt: string;
};

export type AdminOrderList = {
  items: AdminOrderRow[];
  total: number;
  page: number;
  totalPages: number;
};

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatusKey;
  paymentMethod: PaymentMethodKey;
  paymentStatus: PaymentStatusKey;
  customerName: string;
  phone: string;
  address: string;
  notes: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: { name: string; unitPrice: number; quantity: number }[];
  samePhone: { total: number; cancelled: number };
};

// প্রতিটা অবস্থায় কয়টা অর্ডার (তালিকার ট্যাবের সংখ্যার জন্য)
export async function getOrderStatusCounts(): Promise<
  Record<OrderStatusKey, number>
> {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts: Record<OrderStatusKey, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

export async function getAdminOrders(params: {
  q?: string;
  status?: OrderStatusKey;
  page?: number;
}): Promise<AdminOrderList> {
  const where: Prisma.OrderWhereInput = {};

  if (params.status) where.status = params.status;

  const term = params.q?.trim().slice(0, 50);
  if (term) {
    const phone = normalizePhone(term);
    where.OR = [
      { orderNumber: { contains: term.toUpperCase().replace(/\s/g, "") } },
      { customerName: { contains: term, mode: "insensitive" } },
      // পুরো সঠিক ফোন নম্বর হলে হুবহু মেলাই, নইলে অংশ মেলাই
      { phone: phone ?? { contains: term.replace(/[\s-]/g, "") } },
    ];
  }

  const total = await prisma.order.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);

  const orders = await prisma.order.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * ORDERS_PAGE_SIZE,
    take: ORDERS_PAGE_SIZE,
    include: { items: { select: { quantity: true } } },
  });

  const items: AdminOrderRow[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    phone: o.phone,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    total: Number(o.total),
    itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    createdAt: o.createdAt.toISOString(),
  }));

  return { items, total, page, totalPages };
}

export async function getAdminOrder(
  id: string
): Promise<AdminOrderDetail | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        select: { name: true, unitPrice: true, quantity: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!order) return null;

  const [phoneTotal, phoneCancelled] = await Promise.all([
    prisma.order.count({ where: { phone: order.phone } }),
    prisma.order.count({ where: { phone: order.phone, status: "CANCELLED" } }),
  ]);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    notes: order.notes,
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((i) => ({
      name: i.name,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
    })),
    samePhone: { total: phoneTotal, cancelled: phoneCancelled },
  };
}