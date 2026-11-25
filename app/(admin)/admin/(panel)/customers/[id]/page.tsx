import Link from "next/link";
import { notFound } from "next/navigation";
import CustomerForm from "@/components/admin/customerForm";
import CollectDueForm from "@/components/admin/collectDueForm";
import OrderStatusBadge from "@/components/admin/orderStatusBadge";
import { customerTypeLabel } from "@/lib/customer-type";
import { formatDateTime, formatPrice } from "@/lib/format";
import { requirePermission } from "@/modules/auth/session";
import { getAdminCustomer } from "@/modules/customers/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: Props) {
  const staff = await requirePermission("customers.view");
  const canManage = staff.permissions.includes("customers.manage");
  const canSeeOrders = staff.permissions.includes("orders.view");
  const canSeeSales = staff.permissions.includes("pos.sell");
    const canCollect = staff.permissions.includes("money.manage");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const customer = await getAdminCustomer(id);
  if (!customer) notFound();

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/admin/customers" className="text-gray-500 hover:text-blue-600">
          ← ক্রেতার তালিকা
        </Link>
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{customer.name}</h1>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
          {customerTypeLabel(customer.type)}
        </span>
        {!customer.isActive && (
          <span className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-600">
            বন্ধ
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">অনলাইন অর্ডারের ইতিহাস</h2>
            <p className="mb-4 text-sm text-gray-600">
              মোট অর্ডার (বাতিল বাদে): {customer.online.orderCount}টি · মোট কেনা:{" "}
              <span className="font-bold">
                {formatPrice(customer.online.totalSpent)}
              </span>
            </p>

            {customer.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500">
                এই নম্বরে এখনো কোনো অনলাইন অর্ডার নেই।
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 text-sm">
                {customer.recentOrders.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <span>
                      {canSeeOrders ? (
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-mono font-medium hover:text-blue-600"
                        >
                          {o.orderNumber}
                        </Link>
                      ) : (
                        <span className="font-mono font-medium">
                          {o.orderNumber}
                        </span>
                      )}
                      <span className="ml-3 text-xs text-gray-500">
                        {formatDateTime(o.createdAt)}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <OrderStatusBadge status={o.status} />
                      <span>{formatPrice(o.total)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          
          </section>
                    <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">বাকি ও আদায়ের হিসাব</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-xs text-gray-500">দোকান থেকে মোট কেনা</p>
                <p className="mt-1 text-lg font-bold">{formatPrice(customer.pos.totalBought)}</p>
              </div>
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-xs text-gray-500">মোট জমা (বিক্রির সময় + পরে)</p>
                <p className="mt-1 text-lg font-bold">
                  {formatPrice(customer.pos.salesPaid + customer.pos.collected)}
                </p>
                                {customer.pos.returnCredit > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    এছাড়া ফেরত মাল থেকে কাটা {formatPrice(customer.pos.returnCredit)}
                  </p>
                )}
              </div>
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  {customer.pos.totalDue < 0 ? "ক্রেতার অগ্রিম জমা" : "বর্তমান বাকি"}
                </p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    customer.pos.totalDue > 0
                      ? "text-red-600"
                      : customer.pos.totalDue < 0
                        ? "text-green-700"
                        : "text-gray-700"
                  }`}
                >
                  {formatPrice(Math.abs(customer.pos.totalDue))}
                </p>
              </div>
            </div>

            {canCollect && (
              <div className="mt-5 border-t border-gray-200 pt-4">
                <h3 className="mb-3 font-semibold">বাকি আদায় / অগ্রিম নিন</h3>
                <CollectDueForm customerId={customer.id} balance={customer.pos.totalDue} />
              </div>
            )}

            {customer.payments.length > 0 && (
              <div className="mt-5 border-t border-gray-200 pt-4">
                <h3 className="mb-2 font-semibold">আদায়ের ইতিহাস</h3>
                <ul className="divide-y divide-gray-200 text-sm">
                  {customer.payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                      <span>
                        <Link
                          href={`/admin/print/receipt/${p.id}`}
                          className="font-mono font-medium text-blue-600 hover:underline"
                        >
                          {p.paymentNumber}
                        </Link>
                        <span className="ml-3 text-xs text-gray-500">
                          {formatDateTime(p.createdAt)} · {p.methodLabel} · {p.staffName}
                        </span>
                      </span>
                      <span className="font-medium text-green-700">{formatPrice(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
                    <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">দোকানের (POS) বিক্রির ইতিহাস</h2>
            <p className="mb-4 text-sm text-gray-600">
              মোট বিক্রি: {customer.pos.saleCount}টি · মোট কেনা:{" "}
              <span className="font-bold">{formatPrice(customer.pos.totalBought)}</span>
              {" · "}
                            <span
                className={
                  customer.pos.totalDue > 0
                    ? "font-bold text-red-600"
                    : customer.pos.totalDue < 0
                      ? "font-bold text-green-700"
                      : "text-gray-600"
                }
              >
                {customer.pos.totalDue < 0
                  ? `জমা: ${formatPrice(-customer.pos.totalDue)}`
                  : `বাকি: ${formatPrice(customer.pos.totalDue)}`}
              </span>
            </p>

            {customer.recentSales.length === 0 ? (
              <p className="text-sm text-gray-500">
                দোকানে এখনো কোনো বিক্রি নেই।
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 text-sm">
                {customer.recentSales.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <span>
                      {canSeeSales ? (
                        <Link
                          href={`/admin/sales/${s.id}`}
                          className="font-mono font-medium hover:text-blue-600"
                        >
                          {s.saleNumber}
                        </Link>
                      ) : (
                        <span className="font-mono font-medium">{s.saleNumber}</span>
                      )}
                      <span className="ml-3 text-xs text-gray-500">
                        {formatDateTime(s.createdAt)}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      {s.due > 0 && (
                        <span className="text-xs text-red-600">
                          বাকি {formatPrice(s.due)}
                        </span>
                      )}
                      <span>{formatPrice(s.total)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {canManage && (
            <section>
              <h2 className="mb-3 text-lg font-bold">তথ্য এডিট</h2>
              <CustomerForm
                mode="edit"
                initial={{
                  id: customer.id,
                  type: customer.type,
                  name: customer.name,
                  contactName: customer.contactName,
                  phone: customer.phone,
                  address: customer.address,
                  note: customer.note,
                }}
              />
            </section>
          )}
        </div>

        <aside>
          <section className="rounded-lg border border-gray-200 bg-white p-5 text-sm">
            <h2 className="mb-3 text-lg font-bold">যোগাযোগ</h2>
            <p>
              <a href={`tel:${customer.phone}`} className="text-blue-600 underline">
                {customer.phone}
              </a>
            </p>
            {customer.contactName && (
              <p className="mt-2 text-gray-700">যোগাযোগ: {customer.contactName}</p>
            )}
            {customer.address && (
              <p className="mt-2 text-gray-700">{customer.address}</p>
            )}
            {customer.note && (
              <p className="mt-3 rounded-md bg-yellow-50 p-3 text-gray-800">
                নোট: {customer.note}
              </p>
            )}
            <p className="mt-3 text-xs text-gray-500">
              যোগ হয়েছে: {formatDateTime(customer.createdAt)}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}