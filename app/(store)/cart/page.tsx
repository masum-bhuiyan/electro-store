import type { Metadata } from "next";
import CartView from "@/components/store/cartView";

export const metadata: Metadata = {
  title: "আপনার কার্ট | Electro Store",
};

export default function CartPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">আপনার কার্ট</h1>
      <CartView />
    </div>
  );
}