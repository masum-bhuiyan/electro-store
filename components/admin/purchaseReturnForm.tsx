"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createPurchaseReturnAction } from "@/app/(admin)/admin/(panel)/purchases/actions";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

type Item = {
  id: string;
  name: string;
  unitCost: number;
  available: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function taka(n: number): string {
  return `৳${round2(n).toLocaleString("en-US")}`;
}

export default function PurchaseReturnForm({
  purchaseId,
  items,
}: {
  purchaseId: string;
  items: Item[];
}) {
  const router = useRouter();
  const submitLock = useRef(false);

  const [qty, setQty] = useState<Record<string, string>>({});
  const [cash, setCash] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // শুধু দেখানোর হিসাব। আসল হিসাব সার্ভারে হয়
  const total = round2(
    items.reduce((sum, i) => sum + (Number(qty[i.id]) || 0) * i.unitCost, 0)
  );
  const cashNumber = Number(cash) || 0;
  const credit = round2(total - cashNumber);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current) return;

    submitLock.current = true;
    setSaving(true);
    setError(null);

    const payload = {
      purchaseId,
      note,
      cashReceived: cash,
      items: items.map((i) => ({
        purchaseItemId: i.id,
        quantity: qty[i.id] ?? "",
      })),
    };

    let navigated = false;
    try {
      const result = await createPurchaseReturnAction(payload);
      if (result.ok) {
        navigated = true;
        router.push(`/admin/purchases/${purchaseId}?returned=1`);
        router.refresh();
        return;
      }
      setError(result.message);
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।");
    } finally {
      if (!navigated) {
        submitLock.current = false;
        setSaving(false);
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-5"
    >
      <div className="space-y-3">
        {items.map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <div>
              <p className="font-medium">{i.name}</p>
              <p className="text-xs text-gray-500">
                কেনা দাম {taka(i.unitCost)} · আরও ফেরত দেওয়া যাবে {i.available}টি
              </p>
            </div>
            {i.available > 0 ? (
              <input
                type="text"
                inputMode="numeric"
                value={qty[i.id] ?? ""}
                placeholder="0"
                onChange={(e) => setQty((p) => ({ ...p, [i.id]: e.target.value }))}
                className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            ) : (
              <span className="text-xs text-gray-400">সব ফেরত দেওয়া হয়েছে</span>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
        <div className="space-y-1 text-sm">
          <p>
            ফেরতের মূল্য: <span className="text-lg font-bold">{taka(total)}</span>
          </p>
          <p className={credit < 0 ? "text-red-600" : "text-gray-700"}>
            বাকি/ক্রেডিট থেকে বাদ: <span className="font-bold">{taka(credit)}</span>
          </p>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            নগদ ফেরত পেয়েছেন (না পেলে ফাঁকা)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={cash}
            placeholder="0"
            onChange={(e) => setCash(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            কারণ বা নোট (ঐচ্ছিক)
          </span>
          <textarea
            value={note}
            rows={2}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={saving || total <= 0}
        className="rounded-md bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : "ফেরত সংরক্ষণ করুন"}
      </button>
    </form>
  );
}