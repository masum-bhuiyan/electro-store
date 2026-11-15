"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getCartSuggestionsAction } from "@/app/(store)/cart/actions";
import { buttonClass } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { closeCartDrawer, useCartDrawerOpen } from "@/lib/cart-drawer";
import {
  addToCart,
  MAX_PER_ITEM,
  removeFromCart,
  setQuantity,
  useCart,
} from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { imageUrl, isAllowedImageUrl } from "@/lib/images";
import { en } from "@/lib/messages";
import { variantLabel } from "@/lib/variant-label";
import type { ProductListItem } from "@/modules/products/queries";

const stepBtn =
  "inline-flex h-11 w-11 items-center justify-center text-xl font-bold text-brand-teal transition-colors hover:bg-brand-mist disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent";

// localStorage বা সার্ভারের লিংক অবিশ্বাস্য হতে পারে, তাই যাচাই করে নিই
function safeImage(src?: string | null): string | null {
  return src && isAllowedImageUrl(src) ? src : null;
}

function Thumb({ src, name, size }: { src: string | null; name: string; size: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white"
    >
      {src ? (
        <img
          src={imageUrl(src, size * 2)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="text-xl font-bold text-gray-300">{name[0]}</span>
      )}
    </div>
  );
}

export default function CartDrawer() {
  const open = useCartDrawerOpen();
  const pathname = usePathname();
  const { items, count, subtotal } = useCart();
  const [suggestions, setSuggestions] = useState<ProductListItem[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // অন্য পেজে গেলে ড্রয়ার বন্ধ
  useEffect(() => {
    closeCartDrawer();
  }, [pathname]);

  // খোলা অবস্থায়: Esc বন্ধ করে, Tab ড্রয়ারের ভেতরেই ঘোরে, পেছনের পেজ স্ক্রল হয় না
  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeCartDrawer();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open]);

  // ড্রয়ার খুললে, বা কার্টের পণ্য বদলালে সাজেশন নতুন করে আনি
  const idsKey = items
    .map((i) => i.variantId)
    .sort()
    .join(",");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    getCartSuggestionsAction(idsKey ? idsKey.split(",") : [])
      .then((list) => {
        if (!cancelled) setSuggestions(list);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open, idsKey]);

  function addSuggestion(p: ProductListItem) {
    if (!p.variant) return;
    const img = safeImage(p.image);
    addToCart({
      variantId: p.variant.id,
      slug: p.slug,
      name: p.name,
      variantLabel: variantLabel(p.variant),
      price: p.variant.price,
      stock: p.variant.stock,
      ...(img ? { image: img } : {}),
    });
  }

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
    >
      <div
        onClick={closeCartDrawer}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={`absolute right-0 top-0 flex h-full w-[90%] max-w-md flex-col bg-white shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2
            id="cart-drawer-title"
            className="flex items-center gap-2 font-heading text-lg font-semibold text-brand-teal"
          >
            {en.cart.title}
            {count > 0 && (
              <span className="rounded-full bg-brand-orange px-2 py-0.5 text-xs font-bold text-brand-teal">
                {count}
              </span>
            )}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCartDrawer}
            aria-label={en.cart.close}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-teal hover:bg-brand-mist"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-gray-700">{en.cart.empty}</p>
              <Link
                href="/products"
                onClick={closeCartDrawer}
                className={`${buttonClass("primary", "md")} mt-4`}
              >
                {en.cart.startShopping}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 px-5">
              {items.map((item) => {
                const limit = Math.min(item.stock, MAX_PER_ITEM);
                const atMax = item.quantity >= limit;
                return (
                  <li key={item.variantId} className="flex gap-3 py-4">
                    <Thumb src={safeImage(item.image)} name={item.name} size={72} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeCartDrawer}
                          className="line-clamp-2 text-sm font-semibold text-brand-teal hover:text-brand-blue"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.variantId)}
                          aria-label={en.cart.removeNamed(item.name)}
                          className="-mr-3 -mt-3 inline-flex h-11 w-11 shrink-0 items-center justify-center text-gray-500 hover:text-red-700"
                        >
                          <Icon name="close" size={18} />
                        </button>
                      </div>

                      {item.variantLabel !== "" && (
                        <p className="text-xs text-gray-600">{item.variantLabel}</p>
                      )}

                      <div className="mt-2 flex items-center justify-between gap-2">
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
                            className="min-w-8 text-center text-sm font-bold text-brand-teal"
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
          )}

          {suggestions.length > 0 && (
            <section className="m-5 rounded-2xl bg-brand-mist p-4">
              <h3 className="font-heading text-base font-semibold text-brand-teal">
                {en.cart.alsoBuy}
              </h3>
              <ul className="mt-2 divide-y divide-gray-200">
                {suggestions.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <Thumb src={safeImage(p.image)} name={p.name} size={56} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${p.slug}`}
                        onClick={closeCartDrawer}
                        className="line-clamp-2 text-sm font-semibold text-brand-teal hover:text-brand-blue"
                      >
                        {p.name}
                      </Link>
                      <p className="text-sm font-bold text-brand-teal">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addSuggestion(p)}
                      aria-label={en.cart.addNamed(p.name)}
                      className="inline-flex h-11 shrink-0 items-center rounded-lg border-2 border-brand-blue bg-white px-3 text-sm font-bold text-brand-blue transition-colors hover:bg-brand-mist"
                    >
                      {en.cart.add}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            <div className="flex justify-between text-base font-bold text-brand-teal">
              <span>{en.cart.subtotal}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">{en.cart.shippingNote}</p>
            <Link
              href="/checkout"
              onClick={closeCartDrawer}
              className={`${buttonClass("primary", "lg")} mt-3 w-full`}
            >
              {en.cart.checkout}
            </Link>
            <p className="mt-2 text-center text-xs font-semibold text-gray-600">
              {en.cart.cod}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}