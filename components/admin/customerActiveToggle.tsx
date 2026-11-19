"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setCustomerActiveAction } from "@/app/(admin)/admin/(panel)/customers/actions";

export default function CustomerActiveToggle({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (pending) return;
    if (isActive && !window.confirm("বন্ধ করলে এই ক্রেতা আর নতুন বিক্রিতে আসবে না। বন্ধ করবেন?")) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      const result = await setCustomerActiveAction(id, !isActive);
      if (result.ok) router.refresh();
      else setError(result.message ?? "বদলানো যায়নি");
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
        className={
          isActive
            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
            : "rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-300 disabled:opacity-50"
        }
      >
        {pending ? "..." : isActive ? "চালু" : "বন্ধ"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}