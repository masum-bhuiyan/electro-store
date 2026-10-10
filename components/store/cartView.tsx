"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import {
  clearCart,
  MAX_PER_ITEM,
  removeFromCart,
  setQuantity,
  useCart,
  useHydrated,
} from "@/lib/cart-store";

export default function CartView() {
  const hydrated = useHydrated();
  const { items, count, subtotal } = useCart();

  // ব্রাউজারে কার্ট পড়ার আগে "খালি" দেখানো ভুল হবে
  if (!hydrated) {
    return <p className="py-10 text-center text-gray-400">কার্ট লোড হচ্ছে...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-gray-600">আপনার কার্ট খালি।</p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          কেনাকাটা শুরু করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {items.map((item) => {
            const limit = Math.min(item.stock, MAX_PER_ITEM);
            return (
              <li
                key={item.variantId}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-medium hover:text-blue-600"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-gray-500">{item.variantLabel}</p>
                  <p className="mt-1 text-sm">{formatPrice(item.price)}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-md border border-gray-300">
                    <button
                      type="button"
                      aria-label="একটি কমান"
                      onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                      className="px-3 py-1 hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="একটি বাড়ান"
                      disabled={item.quantity >= limit}
                      onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                      className="px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                    >
                      +
                    </button>
                  </div>

                  <span className="w-24 text-right font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.variantId)}
                    className="text-sm text-gray-500 hover:text-red-600"
                  >
                    মুছুন
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={clearCart}
          className="mt-4 text-sm text-gray-500 hover:text-red-600"
        >
          কার্ট খালি করুন
        </button>
      </div>

      <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold">অর্ডারের সারসংক্ষেপ</h2>
        <div className="mt-4 flex justify-between text-sm">
          <span className="text-gray-600">মোট পণ্য</span>
          <span>{count}টি</span>
        </div>
        <div className="mt-2 flex justify-between text-base font-bold">
          <span>সাবটোটাল</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          ডেলিভারি চার্জ চেকআউটে যোগ হবে।
        </p>
        <button
          type="button"
          disabled
          className="mt-5 w-full cursor-not-allowed rounded-md bg-gray-300 px-6 py-3 font-medium text-gray-600"
        >
          চেকআউট (দিন ৭-এ চালু হবে)
        </button>
      </aside>
    </div>
  );
}