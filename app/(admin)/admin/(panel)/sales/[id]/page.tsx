import Link from "next/link";
import { notFound } from "next/navigation";
import DraftActions from "@/components/admin/draftActions";
import SaleReturnForm from "@/components/admin/saleReturnForm";
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

export default async function SaleDetailPage({ params }: Props) {
  const staff = await requirePermission("pos.sell");
  const canEdit = staff.permissions.includes("sales.edit");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const s = await getAdminSale(id, false);
  if (!s) notFound();

  const when = whenText(s.createdAt);

  const hasReturns = s.returns.length > 0;
  const itemsTotal = s.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const ratio = itemsTotal > 0 ? s.total / itemsTotal : 1;
  const returnLines = s.items
    .map((i) => ({
      id: i.id,
      name: i.name,
      remaining: i.quantity - i.returnedQty,
      unitPrice: i.unitPrice,
    }))
    .filter((l) => l.remaining > 0);

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
          {s.edits.length > 0 && (
            <span className="ml-3 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              সংশোধিত
            </span>
          )}
          {hasReturns && (
            <span className="ml-3 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
              ফেরত আছে
            </span>
          )}
        </h1>
        <span className="flex flex-wrap items-center gap-2">
          {s.status === "CONFIRMED" && canEdit && !hasReturns && (
            <Link
              href={`/admin/pos?edit=${s.id}`}
              className="rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              সংশোধন করুন
            </Link>
          )}
                    {s.status === "CONFIRMED" && hasReturns && (
            <Link
              href={s.customerId ? `/admin/pos?customer=${s.customerId}` : "/admin/pos"}
              className="rounded-md border border-green-600 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
            >
              বদলে নতুন মাল দিন
            </Link>
          )}
          <Link
            href={`/admin/print/sale/${s.id}`}
            target="_blank"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            মেমো প্রিন্ট
          </Link>
        </span>
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
                  <td className="px-3 py-2">
                    {i.name}
                    {i.returnedQty > 0 && (
                      <span className="ml-2 text-xs text-orange-700">
                        (ফেরত: {i.returnedQty}টি)
                      </span>
                    )}
                  </td>
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
          <span>বাকি (বিক্রির সময়)</span>
          <span className="font-bold">{taka(s.due)}</span>
        </p>
      </div>

      {/* মাল ফেরত নেওয়া */}
      {s.status === "CONFIRMED" && returnLines.length > 0 && (
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-1 text-lg font-bold">মাল ফেরত নিন</h2>
          <p className="mb-3 text-sm text-gray-600">
            ক্রেতার বাকি থাকলে আগে সেখান থেকে কাটা হবে, বাকি না থাকলে পুরো টাকা নগদ ফেরত।
            {s.customerBalance !== null && s.customerBalance > 0 && (
              <>
                {" "}
                এই ক্রেতার এখনকার মোট বাকি:{" "}
                <b className="text-red-600">{taka(s.customerBalance)}</b>।
              </>
            )}
            {s.customerId === null && " (Walk-in ক্রেতা: পুরোটাই নগদ ফেরত)।"}
          </p>
          <SaleReturnForm
            saleId={s.id}
            lines={returnLines}
            ratio={ratio}
            balance={s.customerBalance}
          />
        </section>
      )}

      {/* ফেরতের ইতিহাস */}
      {hasReturns && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold">ফেরতের ইতিহাস</h2>
          <ul className="divide-y divide-gray-100">
            {s.returns.map((r) => (
              <li key={r.id} className="py-2">
                <p className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <Link
                      href={`/admin/print/sale-return/${r.id}`}
                      className="font-mono font-medium text-blue-600 hover:underline"
                    >
                      {r.returnNumber}
                    </Link>
                    <span className="ml-3 text-xs text-gray-500">
                      {whenText(r.createdAt)} · {r.staffName}
                    </span>
                  </span>
                  <span className="font-medium">{taka(r.total)}</span>
                </p>
                <p className="text-xs text-gray-600">
                  {r.items.map((i) => `${i.name} × ${i.quantity}`).join("; ")}
                </p>
                <p className="text-xs text-gray-600">
                  {r.creditAmount > 0 && <>বাকি থেকে কাটা {taka(r.creditAmount)} · </>}
                  নগদ ফেরত {taka(r.cashRefund)}
                </p>
                {r.note && <p className="text-xs text-gray-600">নোট: {r.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.edits.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold">সংশোধনের ইতিহাস</h2>
          <ul className="divide-y divide-gray-100">
            {s.edits.map((e) => (
              <li key={e.id} className="py-2">
                <p className="text-xs text-gray-500">
                  {whenText(e.createdAt)} · {e.staffName}
                </p>
                <p>{e.summary}</p>
                {e.reason && <p className="text-xs text-gray-600">কারণ: {e.reason}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.note && (
        <p className="mt-4 whitespace-pre-line rounded-md bg-white p-3 text-sm text-gray-700">
          নোট: {s.note}
        </p>
      )}
    </div>
  );
}