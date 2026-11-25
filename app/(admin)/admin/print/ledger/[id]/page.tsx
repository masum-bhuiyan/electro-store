import Link from "next/link";
import { notFound } from "next/navigation";
import CustomerLedgerView from "@/components/admin/customerLedger";
import PrintButton from "@/components/admin/printButton";
import { requirePermission } from "@/modules/auth/session";
import { getCustomerLedger } from "@/modules/customers/ledger";

export const dynamic = "force-dynamic";
export const metadata = { title: "খতিয়ান" };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LedgerPage({ params }: Props) {
  await requirePermission("customers.view");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const data = await getCustomerLedger(id);
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
          href={`/admin/customers/${data.customerId}`}
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          ← ক্রেতার পেজে ফিরে যান
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-[210mm] bg-white p-8 shadow print:max-w-none print:p-0 print:shadow-none">
        <CustomerLedgerView data={data} printedAt={printedAt} />
      </div>
    </div>
  );
}