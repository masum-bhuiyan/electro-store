"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createExpenseAction } from "@/app/(admin)/admin/(panel)/expenses/actions";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

const PAY_OPTIONS = [
  { value: "CASH", label: "নগদ" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "BANK", label: "ব্যাংক" },
];

export default function ExpenseForm({
  categories,
  suppliers,
  today,
}: {
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  today: string;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [date, setDate] = useState(today);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setError(null);
    setOkMsg(null);

    try {
      const result = await createExpenseAction({
        date,
        categoryId,
        amount,
        method,
        supplierId,
        note,
      });
      if (result.ok) {
        setAmount("");
        setNote("");
        setOkMsg("খরচ সংরক্ষণ হয়েছে।");
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">তারিখ</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">ক্যাটাগরি</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            <option value="">— বাছুন —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">টাকা</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">মাধ্যম</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={inputClass}
          >
            {PAY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            সাপ্লায়ার সংক্রান্ত হলে (ঐচ্ছিক)
          </span>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className={inputClass}
          >
            <option value="">— কোনোটা নয় —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">নোট (ঐচ্ছিক)</span>
          <input
            type="text"
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {okMsg && <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{okMsg}</p>}

      <button
        type="submit"
        disabled={saving || !categoryId || !(Number(amount) > 0)}
        className="rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : "খরচ সংরক্ষণ করুন"}
      </button>
    </form>
  );
}