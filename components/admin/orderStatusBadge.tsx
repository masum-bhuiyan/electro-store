import { orderStatusLabel, type OrderStatusKey } from "@/lib/order-status";

const STYLE: Record<OrderStatusKey, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function OrderStatusBadge({ status }: { status: OrderStatusKey }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${STYLE[status]}`}
    >
      {orderStatusLabel(status)}
    </span>
  );
}