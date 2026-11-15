import type { Metadata } from "next";
import CartView from "@/components/store/cartView";
import { en } from "@/lib/messages";
import { SHOP_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `${en.cart.title} | ${SHOP_NAME}`,
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-semibold text-brand-teal md:text-3xl">
        {en.cart.title}
      </h1>
      <CartView />
    </div>
  );
}