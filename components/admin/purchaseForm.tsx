"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  createPurchaseAction,
  searchPurchaseProductsAction,
} from "@/app/(admin)/admin/(panel)/purchases/actions";
import type { PurchaseSearchRow } from "@/modules/purchases/search";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

type Line = PurchaseSearchRow & {
  quantity: string;
  unitCost: string;
  newPrice: string;
};

type Supplier = { id: string; name: string };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function taka(n: number): string {
  return `৳${round2(n).toLocaleString("en-US")}`;
}

export default function PurchaseForm({
  suppliers,
  canSetPrice,
  canViewCost,
  initialRows = [],
}: {
  suppliers: Supplier[];
  canSetPrice: boolean;
  canViewCost: boolean;
  initialRows?: PurchaseSearchRow[];
}) {
  const router = useRouter();
  const submitLock = useRef(false);
  const searchCounter = useRef(0);

  const [supplierId, setSupplierId] = useState("");
  const [billNo, setBillNo] = useState("");
  const [note, setNote] = useState("");
  const [paid, setPaid] = useState("");
  const [lines, setLines] = useState<Line[]>(() =>
    initialRows.map((row) => ({
      ...row,
      quantity: "1",
      unitCost: row.costPrice ? String(row.costPrice) : "",
      newPrice: "",
    }))
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PurchaseSearchRow[]>([]);
  const [searching, setSearching] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // নাম লিখলে ০.৩ সেকেন্ড থেমে খোঁজা
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    const myId = ++searchCounter.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const rows = await searchPurchaseProductsAction(term);
        if (myId === searchCounter.current) setResults(rows);
      } catch {
        if (myId === searchCounter.current) setResults([]);
      } finally {
        if (myId === searchCounter.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function addLine(row: PurchaseSearchRow) {
    setLines((prev) =>
      prev.some((l) => l.id === row.id)
        ? prev
        : [
            ...prev,
            {
              ...row,
              quantity: "1",
              unitCost: row.costPrice ? String(row.costPrice) : "",
              newPrice: "",
            },
          ]
    );
    setQuery("");
    setResults([]);
  }

  function updateLine(id: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  // শুধু দেখানোর হিসাব। আসল হিসাব সার্ভারে হয়
  const total = round2(
    lines.reduce(
      (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0),
      0
    )
  );
  const paidNumber = Number(paid) || 0;
  const due = round2(total - paidNumber);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current) return;

    submitLock.current = true;
    setSaving(true);
    setFormError(null);

    const payload = {
      supplierId,
      billNo,
      note,
      paid,
      items: lines.map((l) => ({
        variantId: l.id,
        quantity: l.quantity,
        unitCost: l.unitCost,
        newPrice: canSetPrice ? l.newPrice : "",
      })),
    };

    let navigated = false;
    try {
      const result = await createPurchaseAction(payload);
      if (result.ok) {
        navigated = true;
        router.push("/admin/purchases?saved=1");
        return;
      }
      setFormError(result.message);
    } catch {
      setFormError("সংযোগে সমস্যা হয়েছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।");
    } finally {
      if (!navigated) {
        submitLock.current = false;
        setSaving(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* সাপ্লায়ার ও বিল */}
      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">সাপ্লায়ার</span>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className={inputClass}
          >
            <option value="">— বাছুন —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            সাপ্লায়ারের বিল নম্বর (ঐচ্ছিক)
          </span>
          <input
            type="text"
            value={billNo}
            maxLength={60}
            onChange={(e) => setBillNo(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {/* পণ্য খোঁজা */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            পণ্য খুঁজুন (নাম, SKU বা ব্র্যান্ড)
          </span>
          <input
            type="text"
            value={query}
            maxLength={50}
            placeholder="যেমন: soldering"
            onChange={(e) => setQuery(e.target.value)}
            className={inputClass}
          />
        </label>

        {searching && <p className="mt-2 text-sm text-gray-500">খোঁজা হচ্ছে...</p>}

        {results.length > 0 && (
          <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200">
            {results.map((r) => {
              const added = lines.some((l) => l.id === r.id);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => addLine(r)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <span>
                      {r.name}
                      <span className="ml-2 text-xs text-gray-500">{r.sku}</span>
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      স্টক {r.stock} · বিক্রয় {taka(r.price)}
                      {added && " · যোগ করা হয়েছে"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {!searching && query.trim().length >= 2 && results.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">কোনো পণ্য পাওয়া যায়নি।</p>
        )}
      </div>

      {/* পণ্যের লাইন */}
      {lines.length > 0 && (
        <div className="space-y-3">
          {lines.map((l) => {
            const cost = Number(l.unitCost) || 0;
            const newPriceNum = Number(l.newPrice) || 0;
            const sell = newPriceNum > 0 ? newPriceNum : l.price;
            const margin = sell > 0 && cost > 0 ? ((sell - cost) / sell) * 100 : null;
            const costJump =
              l.costPrice && cost > 0 && cost > l.costPrice * 1.1
                ? Math.round(((cost - l.costPrice) / l.costPrice) * 100)
                : null;
            const qty = Number(l.quantity) || 0;

            return (
              <div key={l.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{l.name}</p>
                    <p className="text-xs text-gray-500">
                      {l.sku} · বর্তমান স্টক {l.stock} · বর্তমান বিক্রয় {taka(l.price)}
                      {canViewCost && l.costPrice !== null && (
                        <> · গড় কেনা দাম {taka(l.costPrice)}</>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(l.id)}
                    className="shrink-0 text-sm text-red-600 hover:underline"
                  >
                    বাদ দিন
                  </button>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">পরিমাণ</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={l.quantity}
                      onChange={(e) => updateLine(l.id, { quantity: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">
                      কেনা দাম (প্রতিটি)
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={l.unitCost}
                      onChange={(e) => updateLine(l.id, { unitCost: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                  {canSetPrice && (
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-gray-600">
                        নতুন বিক্রয় দাম (না বদলালে ফাঁকা)
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={l.newPrice}
                        placeholder={String(l.price)}
                        onChange={(e) => updateLine(l.id, { newPrice: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                  )}
                </div>

                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-gray-600">
                    লাইন মোট: <span className="font-medium">{taka(qty * cost)}</span>
                  </p>
                  {margin !== null && (
                    <p className={margin < 0 ? "text-red-600" : "text-gray-600"}>
                      {margin < 0
                        ? `লোকসান: বিক্রয় দাম ${taka(sell)}, কেনা দামের চেয়ে কম`
                        : `মার্জিন: ${margin.toFixed(1)}% (বিক্রয় ${taka(sell)})`}
                    </p>
                  )}
                  {costJump !== null && (
                    <p className="text-red-600">
                      সতর্কতা: কেনা দাম গড়ের চেয়ে {costJump}% বেশি।
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* মোট, পরিশোধ, বাকি */}
      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-2">
        <div className="space-y-1 text-sm">
          <p>
            বিলের মোট: <span className="text-lg font-bold">{taka(total)}</span>
          </p>
          <p className={due < 0 ? "text-red-600" : "text-gray-700"}>
            বাকি: <span className="font-bold">{taka(due)}</span>
          </p>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            এখন কত টাকা দিলেন (পরিশোধ)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={paid}
            placeholder="0"
            onChange={(e) => setPaid(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-gray-700">নোট (ঐচ্ছিক)</span>
          <textarea
            value={note}
            rows={2}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {formError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>
      )}

      <button
        type="submit"
        disabled={saving || lines.length === 0 || !supplierId}
        className="rounded-md bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : "ক্রয় সংরক্ষণ করুন"}
      </button>
    </form>
  );
}