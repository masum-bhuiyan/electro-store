export type OrderStatusKey =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatusKey = "UNPAID" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethodKey = "COD" | "BKASH" | "NAGAD" | "CARD";

// স্বাভাবিক ক্রমে অর্ডার যে ধাপগুলো পার হয় (বাতিল এর বাইরে)
export const ORDER_STEPS: OrderStatusKey[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
];

const ORDER_STATUS_LABEL: Record<OrderStatusKey, string> = {
  PENDING: "অপেক্ষমান",
  CONFIRMED: "নিশ্চিত",
  SHIPPED: "পাঠানো হয়েছে",
  DELIVERED: "পৌঁছে গেছে",
  CANCELLED: "বাতিল",
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatusKey, string> = {
  UNPAID: "পরিশোধ হয়নি",
  PAID: "পরিশোধিত",
  FAILED: "ব্যর্থ",
  REFUNDED: "ফেরত দেওয়া হয়েছে",
};

const PAYMENT_METHOD_LABEL: Record<PaymentMethodKey, string> = {
  COD: "ক্যাশ অন ডেলিভারি",
  BKASH: "বিকাশ",
  NAGAD: "নগদ",
  CARD: "কার্ড",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status as OrderStatusKey] ?? status;
}

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABEL[status as PaymentStatusKey] ?? status;
}

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABEL[method as PaymentMethodKey] ?? method;
}
export const ALL_ORDER_STATUSES: OrderStatusKey[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export function isOrderStatus(value: unknown): value is OrderStatusKey {
  return (
    typeof value === "string" &&
    (ALL_ORDER_STATUSES as string[]).includes(value)
  );
}

// কোন অবস্থা থেকে কোন কোন অবস্থায় যাওয়া যাবে। সার্ভার ও বোতাম দুজনেই এটা দেখে
export const NEXT_STATUSES: Record<OrderStatusKey, OrderStatusKey[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};