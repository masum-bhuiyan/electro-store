import Link from "next/link";
import {
  CUSTOMER_TYPES,
  CUSTOMER_TYPE_LABELS,
  customerTypeLabel,
  isCustomerType,
} from "@/lib/customer-type";
import { requirePermission } from "@/modules/auth/session";
import { getAdminSales } from "@/modules/sales/admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function taka(n: number): string {
  return `৳${n.toLocaleString("en-US")}`;
}

function dateText(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });
}

export default async function SalesPage({ searchParams }: Props) {
  await requirePermission("pos.sell");

  const sp = await searchParams;
  const q = first(sp.q)?.trim().slice(0, 50) || undefined;
  const typeRaw = first(sp.type);
  const type = isCustomerType(typeRaw) ? typeRaw : undefined;
  const pageNumber = Math.floor(Number(first(sp.page))) || 1;
  const saved = first(sp.saved) === "1";

  const list = await getAdminSales({ q, type, page: pageNumber });

  function href(overrides: { type?: string; page?: number }): string {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const t = "type" in overrides ? overrides.type : type;
    if (t) p.set("type", t);
    if (overrides.page && overrides.page > 1) p.set("page", String(overrides.page));
    const s = p.toString();
    return s ? `/admin/sales?${s}` : "/admin/sales";
  }

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm ${
      active ? "bg-blue-600 text-white" : "border border-gray-300 bg-white hover:bg-gray-50"
    }`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">বিক্রয় ({list.total})</h1>
        <Link
          href="/admin/pos"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + নতুন বিক্রয়
        </Link>
      </div>

      {saved && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          বিক্রয় সংরক্ষণ হয়েছে এবং স্টক কমেছে।
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <Link href={href({ type: undefined })} className={tabClass(!type)}>
          সব
        </Link>
        {CUSTOMER_TYPES.map((t) => (
          <Link key={t} href={href({ type: t })} className={tabClass(type === t)}>
            {CUSTOMER_TYPE_LABELS[t]}
          </Link>
        ))}
      </div>

      <form action="/admin/sales" method="get" className="mb-4 flex gap-2">
        {type && <input type="hidden" name="type" value={type} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={50}
          placeholder="বিক্রয় নম্বর, ক্রেতার নাম বা ফোন"
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          খুঁজুন
        </button>
      </form>

      {list.items.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
          কোনো বিক্রয় পাওয়া যায়নি।
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2">তারিখ</th>
                <th className="px-3 py-2">বিক্রয় নম্বর</th>
                <th className="px-3 py-2">ক্রেতা</th>
                <th className="px-3 py-2 text-right">মোট</th>
                <th className="px-3 py-2 text-right">পরিশোধ</th>
                <th className="px-3 py-2 text-right">বাকি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.items.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">{dateText(s.createdAt)}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/sales/${s.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {s.saleNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {s.customerName ?? "Walk-in"}
                    <span className="ml-2 text-xs text-gray-500">
                      {customerTypeLabel(s.customerType)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">{taka(s.total)}</td>
                  <td className="px-3 py-2 text-right">{taka(s.paid)}</td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      s.due > 0 ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {taka(s.due)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {list.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {list.page > 1 ? (
            <Link href={href({ page: list.page - 1 })} className="text-blue-600 hover:underline">
              ← আগের পেজ
            </Link>
          ) : (
            <span />
          )}
          <span className="text-gray-500">
            পেজ {list.page} / {list.totalPages}
          </span>
          {list.page < list.totalPages ? (
            <Link href={href({ page: list.page + 1 })} className="text-blue-600 hover:underline">
              পরের পেজ →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}