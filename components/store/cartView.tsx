"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { imageUrl, isAllowedImageUrl } from "@/lib/images";
import { en } from "@/lib/messages";
import {
  clearCart,
  MAX_PER_ITEM,
  removeFromCart,
  setQuantity,
  useCart,
  useHydrated,
} from "@/lib/cart-store";

const stepBtn =
  "inline-flex h-11 w-11 items-center justify-center text-xl font-bold text-brand-teal transition-colors hover:bg-brand-mist disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent";

export default function CartView() {
  const hydrated = useHydrated();
  const { items, count, subtotal } = useCart();

  // ব্রাউজারে কার্ট পড়ার আগে "খালি" দেখানো ভুল হবে
  if (!hydrated) {
    return <p className="py-10 text-center text-gray-600">{en.cart.loading}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-gray-700">{en.cart.empty}</p>
        <Link href="/products" className={`${buttonClass("primary", "lg")} mt-5`}>
          {en.cart.startShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
          {items.map((item) => {
            const limit = Math.min(item.stock, MAX_PER_ITEM);
            const atMax = item.quantity >= limit;
            // localStorage-এর লিংক অবিশ্বাস্য হতে পারে, তাই যাচাই করে দেখাই
            const img =
              item.image && isAllowedImageUrl(item.image) ? item.image : null;

            return (
              <li key={item.variantId} className="flex gap-4 p-4">
                <Link
                  href={`/products/${item.slug}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white md:h-24 md:w-24"
                >
                  {img ? (
                    <img
                      src={imageUrl(img, 160)}
                      alt=""
                      width={96}
                      height={96}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-300">
                      {item.name[0]}
                    </span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.slug}`}
                    className="line-clamp-2 font-semibold text-brand-teal hover:text-brand-blue"
                  >
                    {item.name}
                  </Link>
                  {item.variantLabel !== "" && (
                    <p className="mt-0.5 text-sm text-gray-600">{item.variantLabel}</p>
                  )}
                  <p className="mt-1 text-sm font-semibold text-brand-teal">
                    {formatPrice(item.price)}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center overflow-hidden rounded-lg border-2 border-gray-300">
                      <button
                        type="button"
                        aria-label={en.cart.decrease}
                        onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                        className={stepBtn}
                      >
                        −
                      </button>
                      <span
                        className="min-w-10 text-center text-sm font-bold text-brand-teal"
                        aria-live="polite"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={en.cart.increase}
                        disabled={atMax}
                        onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                        className={stepBtn}
                      >
                        +
                      </button>
                    </div>

                    <span className="font-bold text-brand-teal">
                      {formatPrice(item.price * item.quantity)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.variantId)}
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-gray-600 underline hover:text-red-700"
                    >
                      {en.cart.remove}
                    </button>
                  </div>

                  {atMax && (
                    <p className="mt-1 text-xs font-semibold text-orange-700">
                      {en.cart.maxReached}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-blue hover:underline"
          >
            ← {en.cart.continueShopping}
          </Link>
          <button
            type="button"
            onClick={clearCart}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-gray-600 underline hover:text-red-700"
          >
            {en.cart.clear}
          </button>
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-4">
        <h2 className="font-heading text-lg font-semibold text-brand-teal">
          {en.cart.summary}
        </h2>
        <div className="mt-4 flex justify-between text-sm text-gray-700">
          <span>{en.cart.items(count)}</span>
        </div>
        <div className="mt-2 flex justify-between text-base font-bold text-brand-teal">
          <span>{en.cart.subtotal}</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-2 text-xs text-gray-600">{en.cart.shippingNote}</p>

        <Link href="/checkout" className={`${buttonClass("primary", "lg")} mt-5 w-full`}>
          {en.cart.checkout}
        </Link>

        <p className="mt-3 text-center text-xs font-semibold text-gray-600">
          {en.cart.cod}
        </p>
      </aside>
    </div>
  );
}