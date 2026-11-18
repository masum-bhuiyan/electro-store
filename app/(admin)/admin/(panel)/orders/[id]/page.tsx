import Link from "next/link";
import { notFound } from "next/navigation";
import OrderEditForm from "@/components/admin/orderEditForm";
import OrderStatusBadge from "@/components/admin/orderStatusBadge";
import OrderStatusControl from "@/components/admin/orderStatusControl";
import { formatDateTime, formatPrice } from "@/lib/format";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/order-status";
import { requirePermission } from "@/modules/auth/session";
import { getAdminOrder } from "@/modules/orders/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const staff = await requirePermission("orders.view");
  const canManage = staff.permissions.includes("orders.manage");
  const canEditPrice = staff.permissions.includes("orders.editPrice");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const order = await getAdminOrder(id);
  if (!order) notFound();

  const warn = order.samePhone.cancelled >= 2;
  const editable = order.status === "PENDING" || order.status === "CONFIRMED";

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/admin/orders" className="text-gray-500 hover:text-blue-600">
          ← অর্ডার তালিকা
        </Link>
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-bold">{order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="-mt-4 mb-6 text-sm text-gray-500">
        অর্ডারের সময়: {formatDateTime(order.createdAt)} · শেষ বদল:{" "}
        {formatDateTime(order.updatedAt)}
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">অবস্থা বদলান</h2>
            {canManage ? (
              <OrderStatusControl orderId={order.id} status={order.status} />
            ) : (
              <p className="text-sm text-gray-500">
                অর্ডারের অবস্থা বদলানোর অনুমতি আপনার নেই।
              </p>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">পণ্য</h2>
            <ul className="divide-y divide-gray-200 text-sm">
              {order.items.map((item) => {
                const hasDiscount =
                  item.listPrice !== null && item.listPrice > item.unitPrice;
                const percent = hasDiscount
                  ? Math.round(
                      ((item.listPrice! - item.unitPrice) / item.listPrice!) * 100
                    )
                  : 0;
                return (
                  <li key={item.id} className="flex justify-between gap-3 py-3">
                    <span>
                      <span className="block font-medium">{item.name}</span>
                      <span className="block text-xs text-gray-500">
                        {formatPrice(item.unitPrice)} × {item.quantity}
                        {hasDiscount && (
                          <>
                            {" "}
                            <span className="line-through">
                              {formatPrice(item.listPrice!)}
                            </span>{" "}
                            <span className="font-medium text-green-700">
                              ({percent}% ছাড়)
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-2 space-y-2 border-t border-gray-200 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">সাবটোটাল</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ডেলিভারি চার্জ</span>
                <span>
                  {formatPrice(order.shippingFee)}
                  {order.originalShippingFee !== null &&
                    order.originalShippingFee !== order.shippingFee && (
                      <span className="ml-2 text-xs text-gray-500">
                        (ক্রেতা দেখেছিল {formatPrice(order.originalShippingFee)})
                      </span>
                    )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>মোট</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          {canEditPrice && editable && (
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-1 text-lg font-bold">দাম ও ডেলিভারি এডিট</h2>
              <p className="mb-4 text-sm text-gray-500">
                ছাড় দিতে বা ডেলিভারি চার্জ ঠিক করতে এখানে বদলান। প্রতিটা বদল লগে থাকবে।
              </p>
              <OrderEditForm
                orderId={order.id}
                items={order.items.map((i) => ({
                  id: i.id,
                  name: i.name,
                  unitPrice: i.unitPrice,
                  quantity: i.quantity,
                }))}
                zone={order.zone}
                shippingFee={order.shippingFee}
              />
            </section>
          )}

          {order.edits.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-bold">বদলের লগ</h2>
              <ul className="divide-y divide-gray-200 text-sm">
                {order.edits.map((e) => (
                  <li key={e.id} className="py-3">
                    <p className="text-xs text-gray-500">
                      {formatDateTime(e.createdAt)} · {e.staffName}
                    </p>
                    <p className="mt-1 whitespace-pre-line">{e.summary}</p>
                    {e.reason && (
                      <p className="mt-1 text-gray-600">কারণ: {e.reason}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-5 text-sm">
            <h2 className="mb-3 text-lg font-bold">ক্রেতা</h2>
            <p className="font-medium">{order.customerName}</p>
            <p className="mt-1">
              <a href={`tel:${order.phone}`} className="text-blue-600 underline">
                {order.phone}
              </a>
            </p>
            <p className="mt-3 text-gray-700">{order.address}</p>
            {order.notes && (
              <p className="mt-3 rounded-md bg-yellow-50 p-3 text-gray-800">
                নোট: {order.notes}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 text-sm">
            <h2 className="mb-3 text-lg font-bold">পেমেন্ট</h2>
            <p>{paymentMethodLabel(order.paymentMethod)}</p>
            <p className="mt-1 text-gray-600">
              {paymentStatusLabel(order.paymentStatus)}
            </p>
          </section>

          <section
            className={
              warn
                ? "rounded-lg border border-red-300 bg-red-50 p-5 text-sm"
                : "rounded-lg border border-gray-200 bg-white p-5 text-sm"
            }
          >
            <h2 className="mb-2 text-lg font-bold">এই ফোন নম্বরের ইতিহাস</h2>
            <p>
              মোট অর্ডার: {order.samePhone.total}টি · বাতিল:{" "}
              {order.samePhone.cancelled}টি
            </p>
            {warn && (
              <p className="mt-2 font-medium text-red-700">
                সতর্কতা: এই নম্বরের একাধিক অর্ডার বাতিল হয়েছে। অর্ডার নিশ্চিত করার আগে ফোনে কথা বলে নিন।
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}