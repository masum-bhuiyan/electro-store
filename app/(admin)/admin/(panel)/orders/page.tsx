import Link from "next/link";
import OrderStatusBadge from "@/components/admin/orderStatusBadge";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  ALL_ORDER_STATUSES,
  isOrderStatus,
  orderStatusLabel,
  paymentMethodLabel,
  type OrderStatusKey,
} from "@/lib/order-status";
import { requireAdmin } from "@/modules/auth/session";
import { getAdminOrders, getOrderStatusCounts } from "@/modules/orders/admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin();

  const sp = await searchParams;
  const q = first(sp.q)?.trim().slice(0, 50) || undefined;
  const statusRaw = first(sp.status);
  const status: OrderStatusKey | undefined = isOrderStatus(statusRaw)
    ? statusRaw
    : undefined;
  const pageNumber = Math.floor(Number(first(sp.page))) || 1;

  const [{ items, total, page, totalPages }, counts] = await Promise.all([
    getAdminOrders({ q, status, page: pageNumber }),
    getOrderStatusCounts(),
  ]);

  const allCount = Object.values(counts).reduce((sum, n) => sum + n, 0);

  function href(opts: { status?: OrderStatusKey; page?: number }): string {
    const p = new URLSearchParams();
    if (opts.status) p.set("status", opts.status);
    if (q) p.set("q", q);
    if (opts.page && opts.page > 1) p.set("page", String(opts.page));
    const query = p.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  }

  const tabClass = (active: boolean) =>
    active
      ? "rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white"
      : "rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm hover:bg-gray-50";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">অর্ডার</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={href({})} className={tabClass(!status)}>
          সব ({allCount})
        </Link>
        {ALL_ORDER_STATUSES.map((s) => (
          <Link key={s} href={href({ status: s })} className={tabClass(status === s)}>
            {orderStatusLabel(s)} ({counts[s]})
          </Link>
        ))}
      </div>

      <form action="/admin/orders" method="get" className="mb-4 flex gap-3">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={50}
          placeholder="অর্ডার নম্বর, ক্রেতার নাম বা ফোন নম্বর"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          খুঁজুন
        </button>
      </form>

      <p className="mb-3 text-sm text-gray-500">{total}টি অর্ডার</p>

      {items.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          {q || status ? "এই শর্তে কোনো অর্ডার মেলেনি।" : "এখনো কোনো অর্ডার নেই।"}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">অর্ডার নম্বর</th>
                <th className="px-4 py-3 font-medium">সময়</th>
                <th className="px-4 py-3 font-medium">ক্রেতা</th>
                <th className="px-4 py-3 font-medium">পণ্য</th>
                <th className="px-4 py-3 font-medium">মোট</th>
                <th className="px-4 py-3 font-medium">পেমেন্ট</th>
                <th className="px-4 py-3 font-medium">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono font-medium hover:text-blue-600"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDateTime(o.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.customerName}</p>
                    <p className="text-xs text-gray-500">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3">{o.itemCount}টি</td>
                  <td className="px-4 py-3">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {paymentMethodLabel(o.paymentMethod)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          {page > 1 ? (
            <Link href={href({ status, page: page - 1 })} className="text-blue-600 underline">
              ← আগের
            </Link>
          ) : (
            <span className="text-gray-300">← আগের</span>
          )}
          <span className="text-gray-600">
            পেজ {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={href({ status, page: page + 1 })} className="text-blue-600 underline">
              পরের →
            </Link>
          ) : (
            <span className="text-gray-300">পরের →</span>
          )}
        </div>
      )}
    </div>
  );
}