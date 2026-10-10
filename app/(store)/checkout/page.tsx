import type { Metadata } from "next";
import CheckoutView from "@/components/store/checkoutView";

export const metadata: Metadata = {
  title: "চেকআউট | Electro Store",
};

export default function CheckoutPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">চেকআউট</h1>
      <CheckoutView />
    </div>
  );
}