import Link from "next/link";
import { notFound } from "next/navigation";
import DraftActions from "@/components/admin/draftActions";
import { customerTypeLabel } from "@/lib/customer-type";
import { requirePermission } from "@/modules/auth/session";
import { getAdminSale } from "@/modules/sales/admin";
import { SALE_PAY_LABELS, type SalePayMethodKey } from "@/modules/sales/validation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function taka(n: number): string {
  return `৳${round2(n).toLocaleString("en-US")}`;
}

export default async function SaleDetailPage({ params }: Props) {
    await requirePermission("pos.sell");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

    const s = await getAdminSale(id, false);
  if (!s) notFound();

  const when = new Date(s.createdAt).toLocaleString("en-GB", {
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
        <Link href="/admin/sales" className="text-gray-500 hover:text-blue-600">
          ← বিক্রয়ের তালিকা
        </Link>
      </p>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold">
          {s.saleNumber}
          {s.status === "DRAFT" && (
            <span className="ml-3 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
              ড্রাফট
            </span>
          )}
        </h1>
        <Link
          href={`/admin/print/sale/${s.id}`}
          target="_blank"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          মেমো প্রিন্ট
        </Link>
      </div>
      <p className="mb-4 text-sm text-gray-600">
        {s.customerId ? (
          <Link href={`/admin/customers/${s.customerId}`} className="text-blue-600 hover:underline">
            {s.customerName}
          </Link>
        ) : (
          "Walk-in ক্রেতা"
        )}
        {s.customerPhone && <> · {s.customerPhone}</>}
        {" · "}
        {customerTypeLabel(s.customerType)}
        {" · "}
        {when}
        {" · "}বিক্রি করেছেন: {s.staffName}
      </p>
            {s.status === "DRAFT" && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          <span>
            এটা ড্রাফট। পণ্যের স্টক আটকে আছে। ক্রেতা এলে কনফার্ম করুন, না এলে ডিলিট করুন।
          </span>
                   <span className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/pos?draft=${s.id}`}
              className="rounded-md border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              এডিট করুন
            </Link>
            <DraftActions saleId={s.id} showConfirm afterDelete="list" />
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2">পণ্য</th>
              <th className="px-3 py-2 text-right">পরিমাণ</th>
              <th className="px-3 py-2 text-right">আসল দাম</th>
              <th className="px-3 py-2 text-right">বিক্রয় দাম</th>
              <th className="px-3 py-2 text-right">ছাড়</th>
              <th className="px-3 py-2 text-right">মোট</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {s.items.map((i) => {
              const discount =
                i.listPrice > 0 ? ((i.listPrice - i.unitPrice) / i.listPrice) * 100 : 0;
              return (
                <tr key={i.id}>
                  <td className="px-3 py-2">{i.name}</td>
                  <td className="px-3 py-2 text-right">{i.quantity}</td>
                  <td className="px-3 py-2 text-right">{taka(i.listPrice)}</td>
                  <td className="px-3 py-2 text-right">{taka(i.unitPrice)}</td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {Math.abs(discount) >= 0.05 ? `${discount.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">{taka(i.quantity * i.unitPrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 max-w-sm space-y-1 rounded-lg border border-gray-200 bg-white p-4 text-sm">
                {s.extraDiscount > 0 && (
          <p className="flex justify-between text-gray-600">
            <span>অতিরিক্ত ছাড় (বিল বন্ধ)</span>
            <span>− {taka(s.extraDiscount)}</span>
          </p>
        )}
        <p className="flex justify-between">
          <span>মোট</span>
          <span className="font-bold">{taka(s.total)}</span>
        </p>
        <p className="flex justify-between">
          <span>
            পরিশোধ (
            {SALE_PAY_LABELS[s.payMethod as SalePayMethodKey] ?? s.payMethod})
          </span>
          <span>{taka(s.paid)}</span>
        </p>
        <p className={`flex justify-between ${s.due > 0 ? "text-red-600" : "text-gray-600"}`}>
          <span>বাকি</span>
          <span className="font-bold">{taka(s.due)}</span>
        </p>
      </div>

      {s.note && (
        <p className="mt-4 whitespace-pre-line rounded-md bg-white p-3 text-sm text-gray-700">
          নোট: {s.note}
        </p>
      )}
    </div>
  );
}