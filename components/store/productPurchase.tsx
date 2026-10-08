"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import type { ProductVariantItem } from "@/modules/products/queries";

function variantLabel(v: ProductVariantItem): string {
  return [v.color, v.storage].filter(Boolean).join(" / ") || v.sku;
}

export default function productPurchase({
  variants,
}: {
  variants: ProductVariantItem[];
}) {
  // শুরুতে প্রথম যে ভ্যারিয়ান্টের স্টক আছে সেটা বাছাই থাকবে
  const [selectedId, setSelectedId] = useState(
    (variants.find((v) => v.stock > 0) ?? variants[0]).id
  );

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  const discount =
    selected.comparePrice && selected.comparePrice > selected.price
      ? Math.round(
          ((selected.comparePrice - selected.price) / selected.comparePrice) * 100
        )
      : 0;

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
        disabled
        className="mt-6 w-full cursor-not-allowed rounded-md bg-gray-300 px-6 py-3 font-medium text-gray-600 md:w-auto"
      >
        কার্টে যোগ করুন (দিন ৬-এ চালু হবে)
      </button>
    </div>
  );
}