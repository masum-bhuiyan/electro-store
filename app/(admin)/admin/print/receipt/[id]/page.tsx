import Link from "next/link";
import { notFound } from "next/navigation";
import PaymentReceipt from "@/components/admin/paymentReceipt";
import PrintButton from "@/components/admin/printButton";
import { requirePermission } from "@/modules/auth/session";
import { getCustomerReceipt } from "@/modules/payments/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "রসিদ" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReceiptPage({ params, searchParams }: Props) {
  await requirePermission("customers.view");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const sp = await searchParams;
  const withBills = (Array.isArray(sp.bills) ? sp.bills[0] : sp.bills) === "1";

  const data = await getCustomerReceipt(id, withBills);
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
          href={`/admin/customers/${data.customerId}`}
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          ← ক্রেতার পেজে ফিরে যান
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={withBills ? `/admin/print/receipt/${id}` : `/admin/print/receipt/${id}?bills=1`}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            {withBills ? "বিলের তালিকা ছাড়া দেখুন" : "বিলের তালিকা সহ দেখুন"}
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="mx-auto max-w-[210mm] bg-white p-8 shadow print:max-w-none print:p-0 print:shadow-none">
        <PaymentReceipt data={data} dateText={dateText} />
      </div>
    </div>
  );
}