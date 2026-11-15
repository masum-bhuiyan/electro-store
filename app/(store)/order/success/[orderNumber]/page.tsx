import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/ui/icon";
import { buttonClass } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { en } from "@/lib/messages";
import type { PaymentMethodKey } from "@/lib/order-status";
import { whatsappLink } from "@/lib/whatsapp";
import { getOrderSummary } from "@/modules/orders/queries";
import { normalizeOrderNumber } from "@/modules/orders/validation";

export const dynamic = "force-dynamic";

// এই পেজ Google-এ দেখানোর দরকার নেই
export const metadata: Metadata = {
  title: `${en.success.metaTitle} | ${en.shopName}`,
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

  const method = en.track.paymentMethod[order.paymentMethod as PaymentMethodKey];

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
        <Icon name="check" size={28} />
      </span>

      <h1 className="mt-4 font-heading text-2xl font-bold text-brand-teal">
        {en.success.title}
      </h1>
      <p className="mt-2 text-sm text-gray-600">{en.success.text}</p>

      <div className="mt-6 rounded-lg bg-brand-mist p-4">
        <p className="text-sm text-gray-600">{en.success.orderNumber}</p>
        <p className="mt-1 break-all font-mono text-2xl font-bold text-brand-teal">
          {order.orderNumber}
        </p>
        <p className="mt-2 text-sm text-gray-700">
          {en.success.totalLine(formatPrice(order.total), method)}
        </p>
      </div>

      <p className="mt-5 text-sm text-gray-600">{en.success.saveNote}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/track?order=${order.orderNumber}`}
          className={buttonClass("primary", "lg")}
        >
          {en.success.track}
        </Link>
        <Link href="/products" className={buttonClass("secondary", "lg")}>
          {en.success.continueShopping}
        </Link>
      </div>

      <p className="mt-6 text-sm text-gray-600">
        {en.success.help}{" "}
        <a
          href={whatsappLink(en.success.whatsappMessage(order.orderNumber))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center font-medium text-brand-blue underline"
        >
          {en.success.whatsapp}
        </a>
      </p>
    </div>
  );
}