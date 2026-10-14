import Link from "next/link";
import ProductActiveToggle from "@/components/admin/productActiveToggle";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/modules/auth/session";
import { getAdminProducts } from "@/modules/products/admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireAdmin();

  const sp = await searchParams;
  const q = first(sp.q)?.trim() || undefined;
  const pageNumber = Math.floor(Number(first(sp.page))) || 1;
  const saved = first(sp.saved) === "1";

  const { items, total, page, totalPages } = await getAdminProducts({
    q,
    page: pageNumber,
  });

  function pageHref(target: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/admin/products?${query}` : "/admin/products";
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">প্রোডাক্ট</h1>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + নতুন প্রোডাক্ট
        </Link>
      </div>

      {saved && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
          ✅ সংরক্ষণ হয়েছে।
        </p>
      )}

      <form action="/admin/products" method="get" className="mb-4 flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="নাম, মডেল, ব্র্যান্ড বা SKU দিয়ে খুঁজুন"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          খুঁজুন
        </button>
      </form>

      <p className="mb-3 text-sm text-gray-500">{total}টি প্রোডাক্ট</p>

      {items.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          {q ? "এই শর্তে কোনো প্রোডাক্ট মেলেনি।" : "এখনো কোনো প্রোডাক্ট নেই।"}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">নাম</th>
                <th className="px-4 py-3 font-medium">ব্র্যান্ড / ক্যাটাগরি</th>
                <th className="px-4 py-3 font-medium">দাম (শুরু)</th>
                <th className="px-4 py-3 font-medium">ভ্যারিয়ান্ট</th>
                <th className="px-4 py-3 font-medium">মোট স্টক</th>
                <th className="px-4 py-3 font-medium">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {p.name}
                    </Link>
                    {p.isFeatured && (
                      <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800">
                        বিশেষ
                      </span>
                    )}
                    <p className="font-mono text-xs text-gray-500">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.brandName} / {p.categoryName}
                  </td>
                  <td className="px-4 py-3">{formatPrice(p.minPrice)}</td>
                  <td className="px-4 py-3">{p.variantCount}টি</td>
                  <td
                    className={
                      p.totalStock <= 0
                        ? "px-4 py-3 font-medium text-red-600"
                        : "px-4 py-3"
                    }
                  >
                    {p.totalStock}
                  </td>
                  <td className="px-4 py-3">
                    <ProductActiveToggle id={p.id} isActive={p.isActive} />
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
            <Link href={pageHref(page - 1)} className="text-blue-600 underline">
              ← আগের
            </Link>
          ) : (
            <span className="text-gray-300">← আগের</span>
          )}
          <span className="text-gray-600">
            পেজ {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="text-blue-600 underline">
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