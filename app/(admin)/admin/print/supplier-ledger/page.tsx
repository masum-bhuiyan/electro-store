import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "@/components/admin/printButton";
import SupplierLedgerView from "@/components/admin/supplierLedger";
import { requirePermission } from "@/modules/auth/session";
import { getSupplierLedger } from "@/modules/suppliers/ledger";

export const dynamic = "force-dynamic";
export const metadata = { title: "সাপ্লায়ার খতিয়ান" };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SupplierLedgerPage({ params }: Props) {
  await requirePermission("purchase.manage");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const data = await getSupplierLedger(id);
  if (!data) notFound();

  const printedAt = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
      <style>
        {"@page { size: A4; margin: 12mm; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }"}
      </style>

      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/suppliers/${data.supplierId}`}
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          ← সাপ্লায়ারের পেজে ফিরে যান
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-[210mm] bg-white p-8 shadow print:max-w-none print:p-0 print:shadow-none">
        <SupplierLedgerView data={data} printedAt={printedAt} />
      </div>
    </div>
  );
}