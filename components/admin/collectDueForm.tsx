"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { collectCustomerPaymentAction } from "@/app/(admin)/admin/(panel)/payments/actions";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

const PAY_OPTIONS = [
  { value: "CASH", label: "নগদ" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "BANK", label: "ব্যাংক" },
];

function taka(n: number): string {
  return `৳${(Math.round(n * 100) / 100).toLocaleString("en-US")}`;
}

export default function CollectDueForm({
  customerId,
  balance,
}: {
  customerId: string;
  balance: number;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [amount, setAmount] = useState(balance > 0 ? String(balance) : "");
  const [method, setMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNumber = Number(amount) || 0;
  const after = Math.round((balance - amountNumber) * 100) / 100;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setError(null);

    let navigated = false;
    try {
      const result = await collectCustomerPaymentAction({
        partyId: customerId,
        amount,
        method,
        note,
      });
      if (result.ok) {
        navigated = true;
        router.push(`/admin/print/receipt/${result.id}`);
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
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            কত টাকা পেলেন
          </span>
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

      {amountNumber > 0 && (
        <p className="text-sm text-gray-700">
          {after > 0 && <>এরপর বাকি থাকবে: <b className="text-red-600">{taka(after)}</b></>}
          {after === 0 && <b className="text-green-700">পুরো বাকি শোধ হবে।</b>}
          {after < 0 && (
            <>
              বাকির চেয়ে বেশি। অগ্রিম জমা থাকবে:{" "}
              <b className="text-green-700">{taka(-after)}</b>
            </>
          )}
        </p>
      )}

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={saving || amountNumber <= 0}
        className="rounded-md bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : "আদায় সংরক্ষণ করে রসিদ দেখুন"}
      </button>
    </form>
  );
}