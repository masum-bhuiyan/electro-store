import Link from "next/link";
import { notFound } from "next/navigation";
import PurchaseReturnForm from "@/components/admin/purchaseReturnForm";
import { requirePermission } from "@/modules/auth/session";
import { getAdminPurchase } from "@/modules/purchases/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returned?: string }>;
};

function taka(n: number): string {
  return `৳${n.toLocaleString("en-US")}`;
}

function whenText(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });
}

export default async function PurchaseDetailPage({ params, searchParams }: Props) {
  await requirePermission("purchase.manage");

  const { id } = await params;
  const sp = await searchParams;
  if (!id || id.length > 50) notFound();

  const p = await getAdminPurchase(id);
  if (!p) notFound();

  const returnItems = p.items.map((i) => ({
    id: i.id,
    name: i.name,
    unitCost: i.unitCost,
    available: i.quantity - i.returned,
  }));
  const canReturn = returnItems.some((i) => i.available > 0);

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/admin/purchases" className="text-gray-500 hover:text-blue-600">
          ← ক্রয়ের তালিকা
        </Link>
      </p>
      <h1 className="mb-1 text-2xl font-bold">{p.purchaseNumber}</h1>
      <p className="mb-4 text-sm text-gray-600">
        <Link href={`/admin/suppliers/${p.supplierId}`} className="text-blue-600 hover:underline">
          {p.supplierName}
        </Link>
        {" · "}
        {whenText(p.createdAt)}
        {" · "}এন্ট্রি: {p.staffName}
        {p.billNo && <> · সাপ্লায়ারের বিল: {p.billNo}</>}
      </p>

      {sp.returned === "1" && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          ফেরত সংরক্ষণ হয়েছে এবং স্টক কমেছে।
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2">পণ্য</th>
              <th className="px-3 py-2 text-right">পরিমাণ</th>
              <th className="px-3 py-2 text-right">ফেরত</th>
              <th className="px-3 py-2 text-right">কেনা দাম</th>
              <th className="px-3 py-2 text-right">মোট</th>
              <th className="px-3 py-2">বিক্রয় দাম বদল</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {p.items.map((i) => (
              <tr key={i.id}>
                <td className="px-3 py-2">{i.name}</td>
                <td className="px-3 py-2 text-right">{i.quantity}</td>
                <td className="px-3 py-2 text-right text-gray-600">
                  {i.returned > 0 ? i.returned : "—"}
                </td>
                <td className="px-3 py-2 text-right">{taka(i.unitCost)}</td>
                <td className="px-3 py-2 text-right">{taka(i.quantity * i.unitCost)}</td>
                <td className="px-3 py-2 text-gray-600">
                  {i.oldPrice !== null && i.newPrice !== null
                    ? `${taka(i.oldPrice)} → ${taka(i.newPrice)}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 max-w-sm space-y-1 rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <p className="flex justify-between">
          <span>বিলের মোট</span>
          <span className="font-bold">{taka(p.total)}</span>
        </p>
        <p className="flex justify-between">
          <span>পরিশোধ</span>
          <span>{taka(p.paid)}</span>
        </p>
        <p
          className={`flex justify-between ${p.due > 0 ? "text-red-600" : "text-gray-600"}`}
        >
          <span>বাকি (ফেরত ছাড়া)</span>
          <span className="font-bold">{taka(p.due)}</span>
        </p>
      </div>

      {p.note && (
        <p className="mt-4 whitespace-pre-line rounded-md bg-white p-3 text-sm text-gray-700">
          নোট: {p.note}
        </p>
      )}

      {/* ফেরতের ইতিহাস */}
      {p.returns.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">ফেরতের ইতিহাস</h2>
          <div className="space-y-3">
            {p.returns.map((r) => (
              <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
                <p className="font-medium">
                  {r.returnNumber}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    {whenText(r.createdAt)} · {r.staffName}
                  </span>
                </p>
                <ul className="mt-1 text-gray-700">
                  {r.items.map((ri, idx) => (
                    <li key={idx}>
                      {ri.name} × {ri.quantity}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-gray-600">
                  মূল্য {taka(r.total)}
                  {r.cashReceived > 0 && <> · নগদ ফেরত পেয়েছেন {taka(r.cashReceived)}</>}
                </p>
                {r.note && <p className="mt-1 text-gray-500">নোট: {r.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ফেরত ফর্ম */}
      <div className="mt-8">
        <h2 className="mb-2 text-lg font-semibold">সাপ্লায়ারকে মাল ফেরত</h2>
        {canReturn ? (
          <PurchaseReturnForm purchaseId={p.id} items={returnItems} />
        ) : (
          <p className="rounded-md bg-white p-4 text-sm text-gray-500">
            এই ক্রয়ের সব মাল ফেরত দেওয়া হয়ে গেছে।
          </p>
        )}
      </div>
    </div>
  );
}