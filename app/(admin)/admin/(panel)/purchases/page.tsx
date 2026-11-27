import Link from "next/link";
import LiveSearchBox from "@/components/admin/liveSearchBox";
import { requirePermission } from "@/modules/auth/session";
import { getAdminPurchases } from "@/modules/purchases/admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; page?: string; saved?: string }>;
};

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

export default async function PurchasesPage({ searchParams }: Props) {
  await requirePermission("purchase.manage");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const pageNum = Number(sp.page) || 1;

  const list = await getAdminPurchases({ q, page: pageNum });

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/admin/purchases?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ক্রয় ({list.total})</h1>
        <Link
          href="/admin/purchases/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + নতুন ক্রয়
        </Link>
      </div>

      {sp.saved === "1" && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          ক্রয় সংরক্ষণ হয়েছে এবং স্টক বেড়েছে।
        </p>
      )}

          <LiveSearchBox placeholder="ক্রয় নম্বর, বিল নম্বর বা সাপ্লায়ার (লিখলেই খুঁজবে)" />

      {list.items.length === 0 ? (
        <p className="rounded-md bg-white p-6 text-sm text-gray-500">
          কোনো ক্রয় পাওয়া যায়নি।
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2">তারিখ</th>
                <th className="px-3 py-2">ক্রয় নম্বর</th>
                <th className="px-3 py-2">সাপ্লায়ার</th>
                <th className="px-3 py-2 text-right">মোট</th>
                <th className="px-3 py-2 text-right">পরিশোধ</th>
                <th className="px-3 py-2 text-right">বাকি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">{dateText(p.createdAt)}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/purchases/${p.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {p.purchaseNumber}
                    </Link>
                    {p.billNo && (
                      <span className="ml-2 text-xs text-gray-500">বিল: {p.billNo}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{p.supplierName}</td>
                  <td className="px-3 py-2 text-right">{taka(p.total)}</td>
                  <td className="px-3 py-2 text-right">{taka(p.paid)}</td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      p.due > 0 ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {taka(p.due)}
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
            <Link href={pageHref(list.page - 1)} className="text-blue-600 hover:underline">
              ← আগের পেজ
            </Link>
          ) : (
            <span />
          )}
          <span className="text-gray-500">
            পেজ {list.page} / {list.totalPages}
          </span>
          {list.page < list.totalPages ? (
            <Link href={pageHref(list.page + 1)} className="text-blue-600 hover:underline">
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