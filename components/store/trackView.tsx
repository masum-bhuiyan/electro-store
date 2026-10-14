"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import {
  ORDER_STEPS,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/lib/order-status";
import { trackOrderAction } from "@/app/(store)/track/actions";
import type { TrackedOrder } from "@/modules/orders/queries";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

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
      setError("সংযোগে সমস্যা হয়েছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order ? ORDER_STEPS.indexOf(order.status) : -1;

  return (
    <div className="mx-auto max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-5"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            অর্ডার নম্বর
          </span>
          <input
            type="text"
            value={orderNumber}
            maxLength={30}
            placeholder="ES-261010-K7M3QX"
            autoComplete="off"
            onChange={(e) => setOrderNumber(e.target.value)}
            className={`${inputClass} font-mono uppercase`}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            অর্ডারের সময় দেওয়া মোবাইল নম্বর
          </span>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            maxLength={20}
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </label>

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
        >
          {loading ? "খোঁজা হচ্ছে..." : "অর্ডার খুঁজুন"}
        </button>
      </form>

      {order && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">অর্ডার নম্বর</p>
              <p className="font-mono text-lg font-bold">{order.orderNumber}</p>
              <p className="mt-1 text-xs text-gray-500">
                অর্ডারের সময়:{" "}
                {new Date(order.createdAt).toLocaleString("bn-BD", {
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
                  : "rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
              }
            >
              {orderStatusLabel(order.status)}
            </span>
          </div>

          {order.status === "CANCELLED" ? (
            <p className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700">
              এই অর্ডারটি বাতিল করা হয়েছে।
            </p>
          ) : (
            <ol className="mt-6 flex items-start">
              {ORDER_STEPS.map((step, index) => {
                const done = index <= currentStep;
                return (
                  <li key={step} className="flex flex-1 flex-col items-center text-center">
                    <span
                      className={
                        done
                          ? "flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
                          : "flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-500"
                      }
                    >
                      {done ? "✓" : index + 1}
                    </span>
                    <span
                      className={
                        done
                          ? "mt-2 text-xs font-medium text-gray-900"
                          : "mt-2 text-xs text-gray-500"
                      }
                    >
                      {orderStatusLabel(step)}
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
                  <span className="block font-medium">{item.name}</span>
                  <span className="block text-xs text-gray-500">
                    {formatPrice(item.unitPrice)} × {item.quantity}
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
              <span className="text-gray-600">সাবটোটাল</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ডেলিভারি চার্জ</span>
              <span>{formatPrice(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>মোট</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <p className="pt-2 text-gray-600">
              পেমেন্ট: {paymentMethodLabel(order.paymentMethod)} ·{" "}
              {paymentStatusLabel(order.paymentStatus)}
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-gray-500">
            কোনো প্রশ্ন থাকলে অর্ডার নম্বরটি জানিয়ে আমাদের সাথে যোগাযোগ করুন।
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/products" className="text-gray-500 underline hover:text-blue-600">
          কেনাকাটা চালিয়ে যান
        </Link>
      </p>
    </div>
  );
}