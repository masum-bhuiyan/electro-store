"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";

export default function CartLink() {
  const { count } = useCart();

  return (
    <Link href="/cart" className="flex items-center gap-1 hover:text-blue-600">
      🛒 কার্ট
      {count > 0 && (
        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
          {count}
        </span>
      )}
    </Link>
  );
}