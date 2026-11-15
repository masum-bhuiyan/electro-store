"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { buttonClass } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { en } from "@/lib/messages";
import { ORDER_STEPS } from "@/lib/order-status";
import { whatsappLink } from "@/lib/whatsapp";
import { trackOrderAction } from "@/app/(store)/track/actions";
import type { TrackedOrder } from "@/modules/orders/queries";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-base text-brand-teal placeholder:text-gray-500";

export default function TrackView({
  defaultOrderNumber,
}: {
  defaultOrderNumber: string;
}) {
  const [orderNumber, setOrderNumber] = useState(defaultOrderNumber);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const result = await trackOrderAction({ orderNumber, phone });
      if (result.ok) {
        setOrder(result.order);
      } else {
        setError(result.message);
      }
    } catch {
      setError(en.track.networkError);
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order ? ORDER_STEPS.indexOf(order.status) : -1;

  return (
    <div className="mx-auto max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            {en.track.orderNumber}
          </span>
          <input
            type="text"
            value={orderNumber}
            maxLength={30}
            placeholder={en.track.orderPlaceholder}
            autoComplete="off"
            onChange={(e) => setOrderNumber(e.target.value)}
            className={`${inputClass} font-mono uppercase`}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            {en.track.phone}
          </span>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            maxLength={20}
            placeholder={en.track.phonePlaceholder}
            autoComplete="tel"
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`${buttonClass("primary", "lg")} w-full`}
        >
          {loading ? en.track.searching : en.track.submit}
        </button>
      </form>

      {order && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-600">{en.track.orderNumber}</p>
              <p className="break-all font-mono text-lg font-bold text-brand-teal">
                {order.orderNumber}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {en.track.placedOn}{" "}
                {new Date(order.createdAt).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Dhaka",
                })}
              </p>
            </div>
            <span
              className={
                order.status === "CANCELLED"
                  ? "rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700"
                  : "rounded-full bg-brand-mist px-3 py-1 text-sm font-medium text-brand-teal"
              }
            >
              {en.track.status[order.status]}
            </span>
          </div>

          {order.status === "CANCELLED" ? (
            <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {en.track.cancelled}
            </p>
          ) : (
            <ol className="mt-6 flex items-start">
              {ORDER_STEPS.map((step, index) => {
                const done = index <= currentStep;
                return (
                  <li
                    key={step}
                    className="flex flex-1 flex-col items-center text-center"
                  >
                    <span
                      className={
                        done
                          ? "flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal text-sm font-bold text-white"
                          : "flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600"
                      }
                    >
                      {done ? <Icon name="check" size={18} /> : index + 1}
                    </span>
                    <span
                      className={
                        done
                          ? "mt-2 text-xs font-medium text-brand-teal"
                          : "mt-2 text-xs text-gray-600"
                      }
                    >
                      {en.track.status[step]}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <ul className="mt-6 divide-y divide-gray-200 border-t border-gray-200 text-sm">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3 py-3">
                <span>
                  <span className="block font-medium text-brand-teal">
                    {item.name}
                  </span>
                  <span className="block text-xs text-gray-600">
                    {en.track.itemTimes(formatPrice(item.unitPrice), item.quantity)}
                  </span>
                </span>
                <span className="shrink-0">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{en.track.subtotal}</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{en.track.delivery}</span>
              <span>{formatPrice(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-brand-teal">
              <span>{en.track.total}</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <p className="pt-2 text-gray-600">
              {en.track.payment}: {en.track.paymentMethod[order.paymentMethod]} ·{" "}
              {en.track.paymentStatus[order.paymentStatus]}
            </p>
          </div>

          <div className="mt-5 border-t border-gray-200 pt-5 text-center">
            <p className="text-sm text-gray-600">{en.track.helpText}</p>
            <a
              href={whatsappLink(en.track.whatsappMessage(order.orderNumber))}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonClass("secondary", "md")} mt-3`}
            >
              {en.track.whatsapp}
            </a>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-sm">
        <Link
          href="/products"
          className="inline-flex min-h-11 items-center text-brand-blue underline"
        >
          {en.track.continueShopping}
        </Link>
      </p>
    </div>
  );
}