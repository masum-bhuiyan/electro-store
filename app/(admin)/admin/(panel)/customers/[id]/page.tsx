import Link from "next/link";
import { notFound } from "next/navigation";
import CustomerForm from "@/components/admin/customerForm";
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
            <p className="mt-4 text-xs text-gray-500">
              দোকানের (POS) বিক্রি ERP-3 শেষ হলে এখানে যোগ হবে।
            </p>
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