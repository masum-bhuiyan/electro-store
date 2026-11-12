"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { buttonClass } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { addToCart, MAX_PER_ITEM, useCart } from "@/lib/cart-store";
import { en } from "@/lib/messages";
import { whatsappLink } from "@/lib/whatsapp";
import type { ProductVariantItem } from "@/modules/products/queries";

function variantLabel(v: ProductVariantItem): string {
  return [v.color, v.storage].filter(Boolean).join(" / ") || v.sku;
}

export default function ProductPurchase({
  productName,
  slug,
  variants,
}: {
  productName: string;
  slug: string;
  variants: ProductVariantItem[];
}) {
  const router = useRouter();

  // শুরুতে প্রথম যে ভ্যারিয়ান্টের স্টক আছে সেটা বাছাই থাকবে
  const [selectedId, setSelectedId] = useState(
    (variants.find((v) => v.stock > 0) ?? variants[0]).id
  );

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  const { items } = useCart();
  const inCart = items.find((i) => i.variantId === selected.id)?.quantity ?? 0;
  const limit = Math.min(selected.stock, MAX_PER_ITEM);
  const canAdd = selected.stock > 0 && inCart < limit;

  const discount =
    selected.comparePrice && selected.comparePrice > selected.price
      ? Math.round(
          ((selected.comparePrice - selected.price) / selected.comparePrice) * 100
        )
      : 0;

  function addSelected() {
    addToCart({
      variantId: selected.id,
      slug,
      name: productName,
      variantLabel: variantLabel(selected),
      price: selected.price,
      stock: selected.stock,
    });
  }

  function handleBuyNow() {
    // কার্টে আগে থেকে থাকলে আবার যোগ করি না, যাতে পরিমাণ অজান্তে না বাড়ে
    if (inCart === 0) addSelected();
    router.push("/checkout");
  }

  function handleWhatsApp() {
    const message = en.product.whatsappMessage(
      productName,
      variantLabel(selected),
      formatPrice(selected.price),
      window.location.href
    );
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
  }

  const outOfStock = selected.stock <= 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-heading text-3xl font-bold text-brand-teal">
          {formatPrice(selected.price)}
        </span>
        {selected.comparePrice && (
          <span className="text-lg text-gray-500 line-through">
            {formatPrice(selected.comparePrice)}
          </span>
        )}
        {discount > 0 && (
          <span className="rounded bg-brand-orange px-2 py-0.5 text-sm font-bold text-brand-teal">
            {en.product.off(discount)}
          </span>
        )}
      </div>

      {variants.length > 1 && (
        <>
          <p className="mt-6 text-sm font-semibold text-brand-teal">
            {en.product.chooseOption}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSelected = v.id === selectedId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  aria-pressed={isSelected}
                  className={[
                    "min-h-11 rounded-lg border-2 px-4 text-sm transition",
                    isSelected
                      ? "border-brand-blue bg-brand-mist font-bold text-brand-blue"
                      : "border-gray-300 hover:border-brand-blue",
                    v.stock <= 0 ? "opacity-50" : "",
                  ].join(" ")}
                >
                  {variantLabel(v)}
                </button>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-4 text-sm font-semibold">
        {outOfStock ? (
          <span className="text-red-700">{en.product.outOfStock}</span>
        ) : selected.stock <= 5 ? (
          <span className="text-orange-700">{en.product.onlyLeft(selected.stock)}</span>
        ) : (
          <span className="text-green-700">{en.product.inStock}</span>
        )}
      </p>

      <div className="mt-6 flex flex-col gap-3 md:max-w-md">
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={outOfStock}
          className={`${buttonClass("primary", "lg")} w-full`}
        >
          {outOfStock ? en.product.outOfStock : en.product.buyNow}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={addSelected}
            disabled={!canAdd}
            className={`${buttonClass("secondary", "lg")} w-full`}
          >
            {canAdd ? en.product.addToCart : outOfStock ? en.product.outOfStock : en.product.maxInCart}
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className={`${buttonClass("secondary", "lg")} w-full`}
          >
            <Icon name="chat" size={20} />
            {en.product.whatsapp}
          </button>
        </div>
      </div>

      {inCart > 0 && (
        <p className="mt-4 text-sm text-green-700">
          {en.product.inCart(inCart)} ·{" "}
          <Link href="/cart" className="font-semibold underline">
            {en.product.viewCart}
          </Link>
        </p>
      )}
    </div>
  );
}