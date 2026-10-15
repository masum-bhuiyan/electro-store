import Link from "next/link";
import { requireAdmin } from "@/modules/auth/session";
import { LOW_STOCK_LIMIT } from "@/modules/admin/stats";
import { getStockList } from "@/modules/inventory/admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminStockPage({ searchParams }: Props) {
  await requireAdmin();

  const sp = await searchParams;
  const q = first(sp.q)?.trim().slice(0, 50) || undefined;
  const lowOnly = first(sp.low) === "1";
  const pageNumber = Math.floor(Number(first(sp.page))) || 1;

  const { items, total, page, totalPages } = await getStockList({
    q,
    lowOnly,
    page: pageNumber,
  });

  function href(opts: { low?: boolean; page?: number }): string {
    const p = new URLSearchParams();
    if (opts.low) p.set("low", "1");
    if (q) p.set("q", q);
    if (opts.page && opts.page > 1) p.set("page", String(opts.page));
    const query = p.toString();
    return query ? `/admin/stock?${query}` : "/admin/stock";
  }

  const tabClass = (active: boolean) =>
    active
      ? "rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white"
      : "rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm hover:bg-gray-50";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">স্টক</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={href({})} className={tabClass(!lowOnly)}>
          সব ভ্যারিয়ান্ট
        </Link>
        <Link href={href({ low: true })} className={tabClass(lowOnly)}>
          কম স্টক ({LOW_STOCK_LIMIT} বা কম)
        </Link>
      </div>

      <form action="/admin/stock" method="get" className="mb-4 flex gap-3">
        {lowOnly && <input type="hidden" name="low" value="1" />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={50}
          placeholder="প্রোডাক্টের নাম, ব্র্যান্ড বা SKU"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          খুঁজুন
        </button>
      </form>

      <p className="mb-3 text-sm text-gray-500">{total}টি ভ্যারিয়ান্ট</p>

      {items.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          {q || lowOnly ? "এই শর্তে কিছু মেলেনি।" : "এখনো কোনো ভ্যারিয়ান্ট নেই।"}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">প্রোডাক্ট</th>
                <th className="px-4 py-3 font-medium">ভ্যারিয়ান্ট</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">স্টক</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{v.productName}</p>
                    {!v.productActive && (
                      <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
                        বন্ধ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.label}</td>
                  <td className="px-4 py-3 font-mono text-xs">{v.sku}</td>
                  <td
                    className={
                      v.stock <= 0
                        ? "px-4 py-3 font-bold text-red-600"
                        : v.stock <= LOW_STOCK_LIMIT
                          ? "px-4 py-3 font-bold text-orange-600"
                          : "px-4 py-3"
                    }
                  >
                    {v.stock}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/stock/${v.id}`}
                      className="text-blue-600 underline"
                    >
                      বদলান
                    </Link>
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
            <Link
              href={href({ low: lowOnly, page: page - 1 })}
              className="text-blue-600 underline"
            >
              ← আগের
            </Link>
          ) : (
            <span className="text-gray-300">← আগের</span>
          )}
          <span className="text-gray-600">
            পেজ {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={href({ low: lowOnly, page: page + 1 })}
              className="text-blue-600 underline"
            >
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
