"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCustomerFromOrderAction } from "@/app/(admin)/admin/(panel)/customers/actions";

export default function CreateCustomerFromOrder({
  orderId,
}: {
  orderId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await createCustomerFromOrderAction(orderId);
      if (result.ok) router.refresh();
      else setError(result.message);
    } catch {
      setError("সংযোগে সমস্যা হয়েছে");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {pending ? "..." : "+ ক্রেতা হিসেবে সংরক্ষণ করুন"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}