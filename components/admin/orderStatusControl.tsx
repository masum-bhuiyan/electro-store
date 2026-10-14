"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { changeOrderStatusAction } from "@/app/(admin)/admin/(panel)/orders/actions";
import { NEXT_STATUSES, type OrderStatusKey } from "@/lib/order-status";

const BUTTON_LABEL: Partial<Record<OrderStatusKey, string>> = {
  CONFIRMED: "অর্ডার নিশ্চিত করুন",
  SHIPPED: "পাঠানো হয়েছে",
  DELIVERED: "পৌঁছে গেছে ও টাকা পেয়েছি",
  CANCELLED: "অর্ডার বাতিল করুন",
};

function confirmText(from: OrderStatusKey, to: OrderStatusKey): string | null {
  if (to === "CANCELLED") {
    return from === "SHIPPED"
      ? "পণ্য কি সত্যিই ফেরত এসেছে? বাতিল করলে পণ্যগুলো এখনই স্টকে ফিরবে। এটা ফেরানো যায় না। বাতিল করবেন?"
      : "বাতিল করলে পণ্যগুলো আবার স্টকে ফিরবে। এটা ফেরানো যায় না। বাতিল করবেন?";
  }
  if (to === "DELIVERED") {
    return "অর্ডারটি পৌঁছে গেছে বলে চূড়ান্ত করবেন? এরপর অবস্থা আর বদলানো যাবে না।";
  }
  return null;
}

export default function OrderStatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatusKey;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = NEXT_STATUSES[status];

  async function handleClick(next: OrderStatusKey) {
    if (pending) return;

    const message = confirmText(status, next);
    if (message && !window.confirm(message)) return;

    setPending(true);
    setError(null);

    try {
      const result = await changeOrderStatusAction(orderId, next);
      if (!result.ok) setError(result.message);
      // সফল হোক বা না হোক, সার্ভার থেকে বর্তমান অবস্থা নতুন করে আনি
      router.refresh();
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।");
    } finally {
      setPending(false);
    }
  }

  if (options.length === 0) {
    return (
      <p className="rounded-md bg-gray-100 p-3 text-sm text-gray-600">
        এই অর্ডারের অবস্থা চূড়ান্ত, আর বদলানো যায় না।
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {options.map((next) => (
          <button
            key={next}
            type="button"
            disabled={pending}
            onClick={() => handleClick(next)}
            className={
              next === "CANCELLED"
                ? "rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                : "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            }
          >
            {pending ? "..." : BUTTON_LABEL[next]}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}