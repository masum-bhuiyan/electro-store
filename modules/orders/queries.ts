import { prisma } from "@/lib/prisma";
import type {
  OrderStatusKey,
  PaymentMethodKey,
  PaymentStatusKey,
} from "@/lib/order-status";

export type OrderSummary = {
  orderNumber: string;
  total: number;
  paymentMethod: PaymentMethodKey;
};

export type TrackedOrder = {
  orderNumber: string;
  status: OrderStatusKey;
  paymentStatus: PaymentStatusKey;
  paymentMethod: PaymentMethodKey;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  items: { name: string; unitPrice: number; quantity: number }[];
};

// সফল পেজের জন্য: ব্যক্তিগত তথ্য ছাড়া শুধু নম্বর, মোট টাকা আর পেমেন্ট পদ্ধতি
export async function getOrderSummary(
  orderNumber: string
): Promise<OrderSummary | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { orderNumber: true, total: true, paymentMethod: true },
  });

  if (!order) return null;

  return {
    orderNumber: order.orderNumber,
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
  };
}

// ট্র্যাকিংয়ের জন্য: অর্ডার নম্বর আর ফোন দুটোই মিললে তবেই তথ্য দিই
export async function getOrderForTracking(
  orderNumber: string,
  phone: string
): Promise<TrackedOrder | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        select: { name: true, unitPrice: true, quantity: true },
        orderBy: { id: "asc" },
      },
    },
  });

  // না পেলে বা ফোন না মিললে একই ফল (null), যাতে বোঝা না যায় কোনটা ভুল
  if (!order || order.phone !== phone) return null;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((i) => ({
      name: i.name,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
    })),
  };
}