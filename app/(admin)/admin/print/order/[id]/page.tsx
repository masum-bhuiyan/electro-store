import Link from "next/link";
import { notFound } from "next/navigation";
import OrderMemo from "@/components/admin/orderMemo";
import PrintButton from "@/components/admin/printButton";
import { requirePermission } from "@/modules/auth/session";
import { getAdminOrder } from "@/modules/orders/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "অর্ডার মেমো" };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderMemoPage({ params }: Props) {
  await requirePermission("orders.view");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const order = await getAdminOrder(id);
  if (!order) notFound();

  const dateText = new Date(order.createdAt).toLocaleString("en-GB", {
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
          href={`/admin/orders/${order.id}`}
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          ← অর্ডারের পেজে ফিরে যান
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            PDF করতে প্রিন্ট ডায়ালগে &quot;Save as PDF&quot; বাছুন
          </span>
          <PrintButton />
        </div>
      </div>

      <div className="mx-auto max-w-[210mm] bg-white p-8 shadow print:max-w-none print:p-0 print:shadow-none">
        <OrderMemo order={order} dateText={dateText} />
      </div>
    </div>
  );
}