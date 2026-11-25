"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { setOpeningBalanceAction } from "@/app/(admin)/admin/(panel)/payments/actions";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

export default function OpeningBalanceForm({
  party,
  partyId,
}: {
  party: "customer" | "supplier";
  partyId: string;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"DUE" | "ADVANCE">("DUE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dueLabel =
    party === "customer" ? "ক্রেতার কাছে আমি পাব (বাকি)" : "আমি সাপ্লায়ারকে দেব (বাকি)";
  const advanceLabel =
    party === "customer" ? "ক্রেতার অগ্রিম জমা আছে" : "সাপ্লায়ার আমাকে দেবে";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    const label = direction === "DUE" ? dueLabel : advanceLabel;
    if (
      !window.confirm(
        `পুরনো বাকি ৳${amount} (${label}) বসাবেন? এটা একবারই বসানো যায়, পরে বদলানো যাবে না।`
      )
    ) {
      return;
    }
    lock.current = true;
    setSaving(true);
    setError(null);

    try {
      const result = await setOpeningBalanceAction({
        party,
        partyId,
        amount,
        direction,
      });
      if (result.ok) {
        router.refresh();
        return;
      }
      setError(result.message);
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">কোন দিকে</span>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "DUE" | "ADVANCE")}
            className={inputClass}
          >
            <option value="DUE">{dueLabel}</option>
            <option value="ADVANCE">{advanceLabel}</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            পুরনো খাতার টাকা
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={saving || !(Number(amount) > 0)}
        className="rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : "পুরনো বাকি বসান"}
      </button>
    </form>
  );
}