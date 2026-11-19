import Link from "next/link";
import CustomerActiveToggle from "@/components/admin/customerActiveToggle";
import {
  CUSTOMER_TYPES,
  CUSTOMER_TYPE_LABELS,
  customerTypeLabel,
  isCustomerType,
  type CustomerTypeKey,
} from "@/lib/customer-type";
import { requirePermission } from "@/modules/auth/session";
import {
  getAdminCustomers,
  getCustomerTypeCounts,
} from "@/modules/customers/admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCustomersPage({ searchParams }: Props) {
  const staff = await requirePermission("customers.view");
  const canManage = staff.permissions.includes("customers.manage");

  const sp = await searchParams;
  const q = first(sp.q)?.trim().slice(0, 50) || undefined;
  const typeRaw = first(sp.type);
  const type: CustomerTypeKey | undefined = isCustomerType(typeRaw)
    ? typeRaw
    : undefined;
  const pageNumber = Math.floor(Number(first(sp.page))) || 1;
  const saved = first(sp.saved) === "1";

  const [{ items, total, page, totalPages }, counts] = await Promise.all([
    getAdminCustomers({ q, type, page: pageNumber }),
    getCustomerTypeCounts(),
  ]);
  const allCount = counts.RETAIL + counts.WHOLESALE;

  function href(opts: { type?: CustomerTypeKey; page?: number }): string {
    const p = new URLSearchParams();
    if (opts.type) p.set("type", opts.type);
    if (q) p.set("q", q);
    if (opts.page && opts.page > 1) p.set("page", String(opts.page));
    const query = p.toString();
    return query ? `/admin/customers?${query}` : "/admin/customers";
  }

  const tabClass = (active: boolean) =>
    active
      ? "rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white"
      : "rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm hover:bg-gray-50";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ক্রেতা</h1>
        {canManage && (
          <Link
            href="/admin/customers/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + নতুন ক্রেতা
          </Link>
        )}
      </div>

      {saved && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
          ✅ সংরক্ষণ হয়েছে।
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={href({})} className={tabClass(!type)}>
          সব ({allCount})
        </Link>
        {CUSTOMER_TYPES.map((t) => (
          <Link key={t} href={href({ type: t })} className={tabClass(type === t)}>
            {CUSTOMER_TYPE_LABELS[t]} ({counts[t]})
          </Link>
        ))}
      </div>

      <form action="/admin/customers" method="get" className="mb-4 flex gap-3">
        {type && <input type="hidden" name="type" value={type} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={50}
          placeholder="নাম, দোকানের নাম বা ফোন নম্বর"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          খুঁজুন
        </button>
      </form>

      <p className="mb-3 text-sm text-gray-500">{total}জন ক্রেতা</p>

      {items.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          {q || type ? "এই শর্তে কাউকে পাওয়া যায়নি।" : "এখনো কোনো ক্রেতা নেই।"}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">নাম</th>
                <th className="px-4 py-3 font-medium">ধরন</th>
                <th className="px-4 py-3 font-medium">ফোন</th>
                <th className="px-4 py-3 font-medium">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {c.name}
                    </Link>
                    {c.contactName && (
                      <p className="text-xs text-gray-500">{c.contactName}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {customerTypeLabel(c.type)}
                  </td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <CustomerActiveToggle id={c.id} isActive={c.isActive} />
                    ) : (
                      <span className="text-xs text-gray-600">
                        {c.isActive ? "চালু" : "বন্ধ"}
                      </span>
                    )}
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
            <Link href={href({ type, page: page - 1 })} className="text-blue-600 underline">
              ← আগের
            </Link>
          ) : (
            <span className="text-gray-300">← আগের</span>
          )}
          <span className="text-gray-600">
            পেজ {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={href({ type, page: page + 1 })} className="text-blue-600 underline">
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