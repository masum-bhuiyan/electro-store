import Link from "next/link";
import SupplierActiveToggle from "@/components/admin/supplierActiveToggle";
import { requirePermission } from "@/modules/auth/session";
import { getAdminSuppliers } from "@/modules/suppliers/admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSuppliersPage({ searchParams }: Props) {
  await requirePermission("purchase.manage");

  const sp = await searchParams;
  const q = first(sp.q)?.trim().slice(0, 50) || undefined;
  const pageNumber = Math.floor(Number(first(sp.page))) || 1;
  const saved = first(sp.saved) === "1";

  const { items, total, page, totalPages } = await getAdminSuppliers({
    q,
    page: pageNumber,
  });

  function pageHref(target: number): string {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (target > 1) p.set("page", String(target));
    const query = p.toString();
    return query ? `/admin/suppliers?${query}` : "/admin/suppliers";
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">সাপ্লায়ার</h1>
        <Link
          href="/admin/suppliers/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + নতুন সাপ্লায়ার
        </Link>
      </div>

      {saved && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
          ✅ সংরক্ষণ হয়েছে।
        </p>
      )}

      <form action="/admin/suppliers" method="get" className="mb-4 flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={50}
          placeholder="নাম বা ফোন নম্বর"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          খুঁজুন
        </button>
      </form>

      <p className="mb-3 text-sm text-gray-500">{total}জন সাপ্লায়ার</p>

      {items.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          {q ? "এই শর্তে কাউকে পাওয়া যায়নি।" : "এখনো কোনো সাপ্লায়ার নেই।"}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">নাম</th>
                <th className="px-4 py-3 font-medium">ফোন</th>
                <th className="px-4 py-3 font-medium">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/suppliers/${s.id}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {s.name}
                    </Link>
                    {s.contactName && (
                      <p className="text-xs text-gray-500">{s.contactName}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <SupplierActiveToggle id={s.id} isActive={s.isActive} />
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