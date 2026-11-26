"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markOrderPaidAction } from "@/app/(admin)/admin/(panel)/orders/actions";
import { formatPrice } from "@/lib/format";

type Props = {
  orderId: string;
  total: number;
  today: string; // ঢাকার আজকের তারিখ YYYY-MM-DD
};

const METHODS = [
  { value: "CASH", label: "নগদ" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "BANK", label: "ব্যাংক" },
];

export default function OrderPaidForm({ orderId, total, today }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState("CASH");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const submitLock = useRef(false);

  function submit() {
    if (submitLock.current) return;
    if (
      !window.confirm(
        `${formatPrice(total)} টাকা হাতে পেয়েছেন, এটা নিশ্চিত? সেভ করলে আর বদলানো যাবে না।`
      )
    ) {
      return;
    }
    submitLock.current = true;
    setError("");
    startTransition(async () => {
      const res = await markOrderPaidAction(orderId, { date, method });
      if (!res.ok) {
        setError(res.message);
        submitLock.current = false;
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        পাওনা: <span className="font-bold">{formatPrice(total)}</span>
      </p>
      <label className="block">
        <span className="mb-1 block text-xs text-gray-600">
          টাকা পাওয়ার তারিখ
        </span>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-gray-600">কোন মাধ্যমে পেয়েছেন</span>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "সেভ হচ্ছে..." : "টাকা পেয়েছি"}
      </button>
    </div>
  );
}