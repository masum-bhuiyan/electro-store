import Link from "next/link";
import { notFound } from "next/navigation";
import StockAdjustForm from "@/components/admin/stockAdjustForm";
import { formatDateTime } from "@/lib/format";
import { stockReasonLabel } from "@/lib/stock";
import { requireAdmin } from "@/modules/auth/session";
import { getStockDetail } from "@/modules/inventory/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ variantId: string }>;
};

export default async function AdminStockDetailPage({ params }: Props) {
  await requireAdmin();

  const { variantId } = await params;
  if (!variantId || variantId.length > 50) notFound();

  const detail = await getStockDetail(variantId);
  if (!detail) notFound();

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/admin/stock" className="text-gray-500 hover:text-blue-600">
          ← স্টকের তালিকা
        </Link>
      </p>

      <h1 className="text-2xl font-bold">{detail.productName}</h1>
      <p className="mt-1 text-sm text-gray-600">
        {detail.label} · <span className="font-mono">{detail.sku}</span>
        {!detail.productActive && (
          <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs">
            প্রোডাক্ট বন্ধ
          </span>
        )}
      </p>
      <p className="mt-1 text-sm">
        <Link
          href={`/admin/products/${detail.productId}`}
          className="text-blue-600 underline"
        >
          প্রোডাক্ট সম্পাদনা
        </Link>
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-gray-200 bg-white p-5 lg:col-span-1">
          <p className="text-sm text-gray-500">বর্তমান স্টক</p>
          <p className="mt-1 text-4xl font-bold">{detail.stock}</p>

          <h2 className="mb-3 mt-6 text-lg font-bold">স্টক বদলান</h2>
          <StockAdjustForm variantId={detail.id} currentStock={detail.stock} />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold">শেষ ২০টা বদল</h2>
          {detail.movements.length === 0 ? (
            <p className="text-sm text-gray-500">এখনো কোনো ইতিহাস নেই।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="py-2 pr-4 font-medium">সময়</th>
                    <th className="py-2 pr-4 font-medium">বদল</th>
                    <th className="py-2 pr-4 font-medium">কারণ</th>
                    <th className="py-2 font-medium">নোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detail.movements.map((m, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-4 text-gray-600">
                        {formatDateTime(m.createdAt)}
                      </td>
                      <td
                        className={
                          m.change < 0
                            ? "py-2 pr-4 font-bold text-red-600"
                            : "py-2 pr-4 font-bold text-green-700"
                        }
                      >
                        {m.change > 0 ? `+${m.change}` : m.change}
                      </td>
                      <td className="py-2 pr-4">{stockReasonLabel(m.reason)}</td>
                      <td className="py-2 text-gray-600">{m.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}