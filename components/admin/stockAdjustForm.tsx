"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { adjustStockAction } from "@/app/(admin)/admin/(panel)/stock/actions";
import type { AdjustAction } from "@/modules/inventory/validation";

const OPTIONS: { value: AdjustAction; label: string }[] = [
  { value: "PURCHASE_IN", label: "নতুন মাল এসেছে (স্টক বাড়বে)" },
  { value: "ADJUST_UP", label: "সংশোধন: স্টক বাড়াও (গণনায় বেশি পাওয়া গেছে)" },
  { value: "ADJUST_DOWN", label: "সংশোধন: স্টক কমাও (নষ্ট, হারানো, গণনায় কম)" },
];

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

export default function StockAdjustForm({
  variantId,
  currentStock,
}: {
  variantId: string;
  currentStock: number;
}) {
  const router = useRouter();
  const submitLock = useRef(false);

  const [action, setAction] = useState<AdjustAction>("PURCHASE_IN");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // সংখ্যা ঠিক থাকলে বদলের পর স্টক কত হবে তার আগাম হিসাব
  const trimmed = amount.trim();
  const preview = /^\d{1,6}$/.test(trimmed)
    ? currentStock + (action === "ADJUST_DOWN" ? -Number(trimmed) : Number(trimmed))
    : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current) return;

    submitLock.current = true;
    setLoading(true);
    setErrors({});
    setFormError(null);
    setDone(null);

    try {
      const result = await adjustStockAction({ variantId, action, amount, note });

      if (result.ok) {
        setDone(`✅ সংরক্ষণ হয়েছে। স্টক এখন ${result.newStock}টি।`);
        setAmount("");
        setNote("");
        router.refresh();
        return;
      }

      setFormError(result.message);
      if (result.errors) setErrors(result.errors);
      router.refresh();
    } catch {
      setFormError("সংযোগে সমস্যা হয়েছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।");
    } finally {
      submitLock.current = false;
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">কী করবেন</span>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value as AdjustAction)}
          className={inputClass}
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {errors.action && (
          <span className="mt-1 block text-sm text-red-600">{errors.action}</span>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">কতটা</span>
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          maxLength={7}
          placeholder="যেমন: 5"
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
        />
        {errors.amount && (
          <span className="mt-1 block text-sm text-red-600">{errors.amount}</span>
        )}
        {preview !== null && (
          <span
            className={
              preview < 0
                ? "mt-1 block text-sm font-medium text-red-600"
                : "mt-1 block text-sm text-gray-600"
            }
          >
            {preview < 0
              ? `স্টকের চেয়ে বেশি কমানো যাবে না (বর্তমান ${currentStock}টি)`
              : `বদলের পর স্টক হবে: ${preview}টি`}
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          নোট / কারণ
          {action === "PURCHASE_IN" && (
            <span className="ml-1 font-normal text-gray-400">(ঐচ্ছিক)</span>
          )}
        </span>
        <input
          type="text"
          value={note}
          maxLength={200}
          placeholder={
            action === "PURCHASE_IN"
              ? "যেমন: সাপ্লায়ারের চালান #১২"
              : "যেমন: গণনায় ভুল / নষ্ট / হারিয়েছে"
          }
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
        {errors.note && (
          <span className="mt-1 block text-sm text-red-600">{errors.note}</span>
        )}
      </label>

      {errors.variantId && (
        <p className="text-sm text-red-600">{errors.variantId}</p>
      )}
      {formError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>
      )}
      {done && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">{done}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
      >
        {loading ? "সংরক্ষণ হচ্ছে..." : "স্টক বদলান"}
      </button>
    </form>
  );
}