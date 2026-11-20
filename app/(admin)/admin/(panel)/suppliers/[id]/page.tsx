import Link from "next/link";
import { notFound } from "next/navigation";
import SupplierForm from "@/components/admin/supplierForm";
import { requirePermission } from "@/modules/auth/session";
import { getAdminSupplier } from "@/modules/suppliers/admin";
import { getSupplierSummary } from "@/modules/suppliers/summary";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
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

export default async function EditSupplierPage({ params }: Props) {
  await requirePermission("purchase.manage");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const supplier = await getAdminSupplier(id);
  if (!supplier) notFound();

  const summary = await getSupplierSummary(id);

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/admin/suppliers" className="text-gray-500 hover:text-blue-600">
          ← সাপ্লায়ারের তালিকা
        </Link>
      </p>
      <h1 className="mb-1 text-2xl font-bold">{supplier.name}</h1>
      {!supplier.isActive && (
        <p className="mb-4 text-sm text-gray-500">এই সাপ্লায়ার বন্ধ আছে।</p>
      )}

          {/* হিসাবের সারাংশ */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">মোট কেনা ({summary.purchaseCount}টি বিল)</p>
          <p className="mt-1 text-xl font-bold">{taka(summary.totalBought)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">মোট পরিশোধ</p>
          <p className="mt-1 text-xl font-bold">{taka(summary.totalPaid)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">মাল ফেরত</p>
          <p className="mt-1 text-xl font-bold">{taka(summary.totalReturned)}</p>
          {summary.cashReceived > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              নগদ ফেরত পেয়েছেন {taka(summary.cashReceived)}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">
            {summary.due < 0 ? "সাপ্লায়ার আপনাকে দেবে" : "বর্তমান বাকি"}
          </p>
          <p
            className={`mt-1 text-xl font-bold ${
              summary.due > 0
                ? "text-red-600"
                : summary.due < 0
                  ? "text-green-700"
                  : "text-gray-700"
            }`}
          >
            {taka(Math.abs(summary.due))}
          </p>
        </div>
      </div>

      {/* সাম্প্রতিক ক্রয় */}
      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">সাম্প্রতিক ক্রয়</h2>
          <div className="flex gap-4 text-sm">
            {summary.purchaseCount > 10 && (
              <Link
                href={`/admin/purchases?q=${encodeURIComponent(supplier.name)}`}
                className="text-blue-600 hover:underline"
              >
                সব ক্রয় দেখুন
              </Link>
            )}
            {supplier.isActive && (
              <Link href="/admin/purchases/new" className="text-blue-600 hover:underline">
                + নতুন ক্রয়
              </Link>
            )}
          </div>
        </div>

        {summary.recent.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
            এই সাপ্লায়ার থেকে এখনো কোনো ক্রয় হয়নি।
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2">তারিখ</th>
                  <th className="px-3 py-2">ক্রয় নম্বর</th>
                  <th className="px-3 py-2 text-right">মোট</th>
                  <th className="px-3 py-2 text-right">পরিশোধ</th>
                  <th className="px-3 py-2 text-right">বাকি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.recent.map((p) => (
                  <tr key={p.id}>
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
      </div>

      {/* সাপ্লায়ারের তথ্য এডিট */}
      <h2 className="mt-8 mb-2 text-lg font-semibold">সাপ্লায়ারের তথ্য</h2>
      <SupplierForm
        mode="edit"
        initial={{
          id: supplier.id,
          name: supplier.name,
          contactName: supplier.contactName,
          phone: supplier.phone,
          address: supplier.address,
          note: supplier.note,
        }}
      />
      <p className="mt-4 text-xs text-gray-500">
        বাকি শোধের হিসাব (সাপ্লায়ারকে পরে টাকা দেওয়া) ERP-5 শেষ হলে এখানে আসবে।
      </p>
    </div>
  );
}