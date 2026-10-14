import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/order-status";
import { getOrderSummary } from "@/modules/orders/queries";
import { normalizeOrderNumber } from "@/modules/orders/validation";

export const dynamic = "force-dynamic";

// এই পেজ Google-এ দেখানোর দরকার নেই
export const metadata: Metadata = {
  title: "অর্ডার সফল | Electro Store",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ orderNumber: string }>;
};

export default async function OrderSuccessPage({ params }: Props) {
  const { orderNumber: raw } = await params;

  const orderNumber = normalizeOrderNumber(raw);
  if (!orderNumber) notFound();

  const order = await getOrderSummary(orderNumber);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg rounded-lg border border-green-200 bg-green-50 p-8 text-center">
      <p className="text-4xl">✅</p>
      <h1 className="mt-3 text-xl font-bold">আপনার অর্ডার গ্রহণ করা হয়েছে</h1>

      <p className="mt-5 text-sm text-gray-700">অর্ডার নম্বর</p>
      <p className="font-mono text-2xl font-bold">{order.orderNumber}</p>

      <p className="mt-3 text-sm text-gray-700">
        মোট {formatPrice(order.total)} · {paymentMethodLabel(order.paymentMethod)}
      </p>

      <p className="mt-5 text-sm text-gray-600">
        অর্ডার নম্বরটি লিখে রাখুন বা স্ক্রিনশট নিন। অর্ডারের অবস্থা দেখতে অর্ডার নম্বরের
        সাথে আপনার মোবাইল নম্বর লাগবে।
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={`/track?order=${order.orderNumber}`}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          অর্ডার ট্র্যাক করুন
        </Link>
        <Link
          href="/products"
          className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium hover:bg-gray-50"
        >
          কেনাকাটা চালিয়ে যান
        </Link>
      </div>
    </div>
  );
}