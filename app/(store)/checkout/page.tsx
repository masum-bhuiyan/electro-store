import type { Metadata } from "next";
import CheckoutView from "@/components/store/checkoutView";
import { en } from "@/lib/messages";
import { SHOP_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `${en.checkout.title} | ${SHOP_NAME}`,
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-semibold text-brand-teal md:text-3xl">
        {en.checkout.title}
      </h1>
      <CheckoutView />
    </div>
  );
}