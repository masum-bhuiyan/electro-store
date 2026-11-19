import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/modules/auth/session";
import { getAdminPurchase } from "@/modules/purchases/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function taka(n: number): string {
  return `৳${n.toLocaleString("en-US")}`;
}

export default async function PurchaseDetailPage({ params }: Props) {
  await requirePermission("purchase.manage");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const p = await getAdminPurchase(id);
  if (!p) notFound();

  const when = new Date(p.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });

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
        {when}
        {" · "}এন্ট্রি: {p.staffName}
        {p.billNo && <> · সাপ্লায়ারের বিল: {p.billNo}</>}
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2">পণ্য</th>
              <th className="px-3 py-2 text-right">পরিমাণ</th>
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
          <span>বাকি</span>
          <span className="font-bold">{taka(p.due)}</span>
        </p>
      </div>

      {p.note && (
        <p className="mt-4 whitespace-pre-line rounded-md bg-white p-3 text-sm text-gray-700">
          নোট: {p.note}
        </p>
      )}
    </div>
  );
}