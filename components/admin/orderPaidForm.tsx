"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markOrderPaidAction } from "@/app/(admin)/admin/(panel)/orders/actions";
import { formatPrice } from "@/lib/format";

type Props = {
  orderId: string;
  subtotal: number; // পণ্যের দাম (আমাদের পাওনা)
  shippingFee: number; // ক্রেতার দেওয়া ডেলিভারি চার্জ (কুরিয়ার রাখবে)
  today: string; // ঢাকার আজকের তারিখ YYYY-MM-DD
};

const METHODS = [
  { value: "CASH", label: "নগদ" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "BANK", label: "ব্যাংক" },
];

export default function OrderPaidForm({
  orderId,
  subtotal,
  shippingFee,
  today,
}: Props) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState("CASH");
  const [extra, setExtra] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const submitLock = useRef(false);

  const extraNum = Number(extra) || 0;
  const net = subtotal - (extraNum > 0 ? extraNum : 0);

  function submit() {
    if (submitLock.current) return;
    const msg =
      extraNum > 0
        ? `${formatPrice(subtotal)} জমা আর ${formatPrice(extraNum)} কুরিয়ার খরচ লেখা হবে (হাতে পাওয়া ${formatPrice(net)})। নিশ্চিত? সেভ করলে আর বদলানো যাবে না।`
        : `${formatPrice(subtotal)} হাতে পেয়েছেন, এটা নিশ্চিত? সেভ করলে আর বদলানো যাবে না।`;
    if (!window.confirm(msg)) return;

    submitLock.current = true;
    setError("");
    startTransition(async () => {
      const res = await markOrderPaidAction(orderId, { date, method, extra });
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
      <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
        <p>
          ডেলিভারি চার্জ {formatPrice(shippingFee)} কুরিয়ার নিজে রাখবে।
        </p>
        <p className="mt-1 text-sm text-gray-800">
          আপনার পাওনা (পণ্যের দাম):{" "}
          <span className="font-bold">{formatPrice(subtotal)}</span>
        </p>
      </div>

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
        <span className="mb-1 block text-xs text-gray-600">
          কোন মাধ্যমে পেয়েছেন
        </span>
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

      <label className="block">
        <span className="mb-1 block text-xs text-gray-600">
          কুরিয়ারের বাড়তি চার্জ (ক্রেতার দেওয়া চার্জের চেয়ে বেশি কাটলে)
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={extra}
          placeholder="0"
          onChange={(e) => setExtra(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      {extraNum > 0 && (
        <p className="text-xs text-gray-600">
          হাতে পাবেন: <span className="font-bold">{formatPrice(net)}</span>{" "}
          (বাড়তি চার্জ নিজে খরচে যাবে)
        </p>
      )}

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