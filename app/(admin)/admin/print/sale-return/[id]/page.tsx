import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "@/components/admin/printButton";
import SaleReturnReceipt from "@/components/admin/saleReturnReceipt";
import { requirePermission } from "@/modules/auth/session";
import { getSaleReturnReceipt } from "@/modules/sales/return-queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "ফেরত রসিদ" };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SaleReturnPage({ params }: Props) {
  await requirePermission("pos.sell");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const data = await getSaleReturnReceipt(id);
  if (!data) notFound();

  const dateText = new Date(data.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
      <style>
        {"@page { size: A4; margin: 12mm; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }"}
      </style>

      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/sales/${data.saleId}`}
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          ← বিক্রয়ের পেজে ফিরে যান
        </Link>
                <div className="flex items-center gap-3">
          <Link
            href={data.customerId ? `/admin/pos?customer=${data.customerId}` : "/admin/pos"}
            className="rounded-md border border-green-600 bg-white px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
          >
            বদলে নতুন মাল দিন
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="mx-auto max-w-[210mm] bg-white p-8 shadow print:max-w-none print:p-0 print:shadow-none">
        <SaleReturnReceipt data={data} dateText={dateText} />
      </div>
    </div>
  );
}