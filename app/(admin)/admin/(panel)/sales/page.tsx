import Link from "next/link";
import DraftActions from "@/components/admin/draftActions";
import {
  CUSTOMER_TYPES,
  CUSTOMER_TYPE_LABELS,
  customerTypeLabel,
  isCustomerType,
} from "@/lib/customer-type";
import { requirePermission } from "@/modules/auth/session";
import { getAdminSales, getDraftCount } from "@/modules/sales/admin";

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

function ageText(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "আজ" : `${days} দিন আগে`;
}

export default async function SalesPage({ searchParams }: Props) {
  await requirePermission("pos.sell");

  const sp = await searchParams;
  const q = first(sp.q)?.trim().slice(0, 50) || undefined;
  const typeRaw = first(sp.type);
  const type = isCustomerType(typeRaw) ? typeRaw : undefined;
  const isDraft = first(sp.status) === "DRAFT";
  const pageNumber = Math.floor(Number(first(sp.page))) || 1;
  const savedRaw = first(sp.saved);

  const [list, draftCount] = await Promise.all([
    getAdminSales({
      q,
      type,
      status: isDraft ? "DRAFT" : "CONFIRMED",
      page: pageNumber,
    }),
    getDraftCount(),
  ]);

  function href(overrides: { type?: string; draft?: boolean; page?: number }): string {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const d = "draft" in overrides ? overrides.draft : isDraft;
    if (d) p.set("status", "DRAFT");
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
        <h1 className="text-2xl font-bold">
          {isDraft ? "ড্রাফট" : "বিক্রয়"} ({list.total})
        </h1>
        <Link
          href="/admin/pos"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + নতুন বিক্রয়
        </Link>
      </div>

      {savedRaw === "1" && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          বিক্রয় সংরক্ষণ হয়েছে এবং স্টক কমেছে।
        </p>
      )}
      {savedRaw === "draft" && (
        <p className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          ড্রাফট রাখা হয়েছে। স্টক আটকে আছে। ক্রেতা না এলে ড্রাফট ডিলিট করুন।
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <Link
          href={href({ type: undefined, draft: false })}
          className={tabClass(!isDraft && !type)}
        >
          সব
        </Link>
        {CUSTOMER_TYPES.map((t) => (
          <Link
            key={t}
            href={href({ type: t, draft: false })}
            className={tabClass(!isDraft && type === t)}
          >
            {CUSTOMER_TYPE_LABELS[t]}
          </Link>
        ))}
        <Link
          href={href({ type: undefined, draft: true })}
          className={tabClass(isDraft)}
        >
          ড্রাফট ({draftCount})
        </Link>
      </div>

      <form action="/admin/sales" method="get" className="mb-4 flex gap-2">
        {isDraft && <input type="hidden" name="status" value="DRAFT" />}
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
          {isDraft ? "কোনো ড্রাফট নেই।" : "কোনো বিক্রয় পাওয়া যায়নি।"}
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
                {isDraft && <th className="px-3 py-2"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.items.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {dateText(s.createdAt)}
                    {isDraft && (
                      <span className="block text-xs text-yellow-700">
                        {ageText(s.createdAt)}
                      </span>
                    )}
                  </td>
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
                  {isDraft && (
                    <td className="px-3 py-2 text-right">
                                            <Link
                        href={`/admin/pos?draft=${s.id}`}
                        className="mr-3 text-sm text-blue-600 hover:underline"
                      >
                        এডিট
                      </Link>
                      <DraftActions
                        saleId={s.id}
                        showConfirm={false}
                        afterDelete="refresh"
                      />
                    </td>
                  )}
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