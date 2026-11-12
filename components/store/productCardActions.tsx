"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { buttonClass } from "@/components/ui/button";
import { addToCart, MAX_PER_ITEM, useCart } from "@/lib/cart-store";
import { en } from "@/lib/messages";
import { variantLabel } from "@/lib/variant-label";
import type { DefaultVariant } from "@/modules/products/queries";

export default function ProductCardActions({
  productName,
  slug,
  variant,
}: {
  productName: string;
  slug: string;
  variant: DefaultVariant;
}) {
  const router = useRouter();
  const { items } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const inCart = items.find((i) => i.variantId === variant.id)?.quantity ?? 0;
  const outOfStock = variant.stock <= 0;
  const canAdd = !outOfStock && inCart < Math.min(variant.stock, MAX_PER_ITEM);

  function add() {
    addToCart({
      variantId: variant.id,
      slug,
      name: productName,
      variantLabel: variantLabel(variant),
      price: variant.price,
      stock: variant.stock,
    });
  }

  function handleBuyNow() {
    // কার্টে আগে থেকে থাকলে আবার যোগ করি না, যাতে পরিমাণ অজান্তে না বাড়ে
    if (inCart === 0) add();
    router.push("/checkout");
  }

  function handleAdd() {
    add();
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={outOfStock}
        className={`${buttonClass("primary", "md")} min-w-0 flex-1`}
      >
        {outOfStock ? en.product.outOfStock : en.product.buyNow}
      </button>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        aria-label={en.card.addToCart}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-brand-blue text-brand-blue transition-colors hover:bg-brand-mist disabled:pointer-events-none disabled:opacity-50"
      >
        <Icon name={added ? "check" : "cart"} size={20} />
      </button>
      <span className="sr-only" aria-live="polite">
        {added ? en.card.added : ""}
      </span>
    </div>
  );
}