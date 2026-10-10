"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { addToCart, MAX_PER_ITEM, useCart } from "@/lib/cart-store";
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

  function handleAdd() {
    addToCart({
      variantId: selected.id,
      slug,
      name: productName,
      variantLabel: variantLabel(selected),
      price: selected.price,
      stock: selected.stock,
    });
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{formatPrice(selected.price)}</span>
        {selected.comparePrice && (
          <span className="text-lg text-gray-400 line-through">
            {formatPrice(selected.comparePrice)}
          </span>
        )}
        {discount > 0 && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-sm font-medium text-red-600">
            {discount}% ছাড়
          </span>
        )}
      </div>

      <p className="mt-6 text-sm font-medium text-gray-700">ভ্যারিয়ান্ট বাছাই করুন</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {variants.map((v) => {
          const isSelected = v.id === selectedId;
          const outOfStock = v.stock <= 0;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedId(v.id)}
              className={[
                "rounded-md border px-4 py-2 text-sm transition",
                isSelected
                  ? "border-blue-600 bg-blue-50 font-medium text-blue-700"
                  : "border-gray-300 hover:border-gray-500",
                outOfStock ? "opacity-50" : "",
              ].join(" ")}
            >
              {variantLabel(v)}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm">
        {selected.stock <= 0 ? (
          <span className="font-medium text-red-600">স্টকে নেই</span>
        ) : selected.stock <= 5 ? (
          <span className="font-medium text-orange-600">
            মাত্র {selected.stock}টি বাকি আছে
          </span>
        ) : (
          <span className="font-medium text-green-600">স্টকে আছে</span>
        )}
      </p>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        className={
          canAdd
            ? "mt-6 w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 md:w-auto"
            : "mt-6 w-full cursor-not-allowed rounded-md bg-gray-300 px-6 py-3 font-medium text-gray-600 md:w-auto"
        }
      >
        {selected.stock <= 0
          ? "স্টকে নেই"
          : canAdd
            ? "কার্টে যোগ করুন"
            : "আর যোগ করা যাবে না"}
      </button>

      {inCart > 0 && (
        <p className="mt-3 text-sm text-green-700">
          ✅ কার্টে আছে: {inCart}টি ·{" "}
          <Link href="/cart" className="font-medium underline">
            কার্ট দেখুন
          </Link>
        </p>
      )}
    </div>
  );
}