"use client";

import Icon from "@/components/ui/icon";
import { openCartDrawer } from "@/lib/cart-drawer";
import { useCart } from "@/lib/cart-store";
import { en } from "@/lib/messages";

export default function CartLink() {
  const { count } = useCart();

  return (
    <button
      type="button"
      onClick={openCartDrawer}
      aria-haspopup="dialog"
      aria-label={en.cart.open(count)}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold hover:text-white/75"
    >
      <Icon name="cart" size={22} />
      <span className="hidden sm:inline">{en.cart.label}</span>
      {count > 0 && (
        <span className="rounded-full bg-brand-orange px-2 py-0.5 text-xs font-bold text-brand-teal">
          {count}
        </span>
      )}
    </button>
  );
}