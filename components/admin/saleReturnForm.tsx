"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createSaleReturnAction } from "@/app/(admin)/admin/(panel)/sales/actions";

const inputClass =
  "rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-600 focus:outline-none";

export type ReturnLine = {
  id: string;
  name: string;
  remaining: number;
  unitPrice: number;
};

function taka(n: number): string {
  return `৳${(Math.round(n * 100) / 100).toLocaleString("en-US")}`;
}

export default function SaleReturnForm({
  saleId,
  lines,
  ratio,
  balance,
}: {
  saleId: string;
  lines: ReturnLine[];
  // বিলের মোট ÷ আইটেমের মোট (অতিরিক্ত ছাড় থাকলে ১-এর কম)
  ratio: number;
  // ক্রেতার এখনকার বাকি। walk-in হলে null
  balance: number | null;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function numberFor(l: ReturnLine): number {
    const n = Number(qty[l.id] ?? "");
    if (!Number.isInteger(n) || n < 0) return 0;
    return Math.min(n, l.remaining);
  }

  const total = lines.reduce(
    (s, l) => s + numberFor(l) * l.unitPrice * ratio,
    0
  );
  const credit = balance !== null && balance > 0 ? Math.min(total, balance) : 0;
  const cash = total - credit;
  const anySelected = lines.some((l) => numberFor(l) > 0);

  function selectAll() {
    const next: Record<string, string> = {};
    for (const l of lines) next[l.id] = String(l.remaining);
    setQty(next);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current || !anySelected) return;
    if (!window.confirm("ফেরত সংরক্ষণ করবেন? পরে এটা বদলানো যাবে না।")) return;
    lock.current = true;
    setSaving(true);
    setError(null);

    let navigated = false;
    try {
      const result = await createSaleReturnAction({
        saleId,
        note,
        items: lines
          .filter((l) => numberFor(l) > 0)
          .map((l) => ({ saleItemId: l.id, quantity: numberFor(l) })),
      });
      if (result.ok) {
        navigated = true;
        router.push(`/admin/print/sale-return/${result.id}`);
        return;
      }
      setError(result.message);
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      if (!navigated) {
        lock.current = false;
        setSaving(false);
      }
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={selectAll}
          className="text-sm text-blue-600 hover:underline"
        >
          সব মাল ফেরত
        </button>
      </div>

      <ul className="divide-y divide-gray-200 text-sm">
        {lines.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>
              {l.name}
              <span className="ml-2 text-xs text-gray-500">
                (সর্বোচ্চ {l.remaining}টি · {taka(l.unitPrice)})
              </span>
            </span>
            <input
              type="number"
              min={0}
              max={l.remaining}
              inputMode="numeric"
              placeholder="0"
              value={qty[l.id] ?? ""}
              onChange={(e) => setQty({ ...qty, [l.id]: e.target.value })}
              className={`${inputClass} w-24 text-right`}
            />
          </li>
        ))}
      </ul>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">
          নোট (ঐচ্ছিক, যেমন ফেরতের কারণ)
        </span>
        <input
          type="text"
          value={note}
          maxLength={300}
          onChange={(e) => setNote(e.target.value)}
          className={`${inputClass} w-full`}
        />
      </label>

      {anySelected && (
        <div className="rounded-md bg-gray-50 p-3 text-sm">
          <p>
            ফেরত মালের মূল্য: <b>{taka(total)}</b>
          </p>
          {credit > 0 && (
            <p>
              ক্রেতার বাকি থেকে কাটা হবে: <b className="text-red-600">{taka(credit)}</b>
            </p>
          )}
          <p>
            নগদ ফেরত দিতে হবে: <b className="text-green-700">{taka(cash)}</b>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            এটা আনুমানিক হিসাব। সংরক্ষণের সময় সার্ভার চূড়ান্ত হিসাব করবে।
          </p>
        </div>
      )}

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={saving || !anySelected}
        className="rounded-md bg-orange-600 px-5 py-2.5 font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : "ফেরত সংরক্ষণ করে রসিদ দেখুন"}
      </button>
    </form>
  );
}