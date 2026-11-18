"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { editOrderAction } from "@/app/(admin)/admin/(panel)/orders/actions";
import { formatPrice } from "@/lib/format";
import { getZoneFee, type Zone } from "@/lib/shipping";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

type Props = {
  orderId: string;
  items: { id: string; name: string; unitPrice: number; quantity: number }[];
  zone: Zone | null;
  shippingFee: number;
};

export default function OrderEditForm({
  orderId,
  items,
  zone,
  shippingFee,
}: Props) {
  const router = useRouter();
  const submitLock = useRef(false);

  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((i) => [i.id, String(i.unitPrice)]))
  );
  const [zoneValue, setZoneValue] = useState<string>(zone ?? "");
  const [fee, setFee] = useState(String(shippingFee));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function handleZoneChange(value: string) {
    setZoneValue(value);
    // এলাকা বদলালে চার্জ নিজে বসে, তারপরও হাতে বদলানো যায়
    if (value === "dhaka" || value === "outside") {
      setFee(String(getZoneFee(value)));
    }
  }

  // শুধু দেখানোর হিসাব। আসল হিসাব সার্ভারে হয়
  const previewSubtotal = items.reduce((sum, i) => {
    const n = Number(prices[i.id]);
    return sum + (Number.isFinite(n) ? n : 0) * i.quantity;
  }, 0);
  const feeNumber = Number(fee);
  const previewTotal =
    previewSubtotal + (Number.isFinite(feeNumber) ? feeNumber : 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current) return;

    submitLock.current = true;
    setSaving(true);
    setErrors({});
    setFormError(null);
    setDone(null);

    try {
      const result = await editOrderAction({
        orderId,
        items: items.map((i) => ({ id: i.id, unitPrice: prices[i.id] })),
        zone: zoneValue,
        shippingFee: fee,
        reason,
      });

      if (result.ok) {
        setDone(
          result.changed ? "✅ সংরক্ষণ হয়েছে।" : "কিছু বদলায়নি, তাই সেভ করা হয়নি।"
        );
        setReason("");
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
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-3">
        {items.map((item, i) => (
          <label key={item.id} className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              {item.name} × {item.quantity} (প্রতিটার দাম ৳)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={prices[item.id]}
              maxLength={11}
              onChange={(e) =>
                setPrices((prev) => ({ ...prev, [item.id]: e.target.value }))
              }
              className={inputClass}
            />
            {errors[`items.${i}`] && (
              <span className="mt-1 block text-sm text-red-600">
                {errors[`items.${i}`]}
              </span>
            )}
          </label>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            ডেলিভারি এলাকা
          </span>
          <select
            value={zoneValue}
            onChange={(e) => handleZoneChange(e.target.value)}
            className={inputClass}
          >
            {zone === null && <option value="">বদলাবেন না</option>}
            <option value="dhaka">ঢাকার ভেতরে</option>
            <option value="outside">ঢাকার বাইরে</option>
          </select>
          {errors.zone && (
            <span className="mt-1 block text-sm text-red-600">{errors.zone}</span>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            ডেলিভারি চার্জ (৳)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={fee}
            maxLength={9}
            onChange={(e) => setFee(e.target.value)}
            className={inputClass}
          />
          {errors.shippingFee && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.shippingFee}
            </span>
          )}
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          কারণ <span className="font-normal text-gray-400">(ঐচ্ছিক)</span>
        </span>
        <input
          type="text"
          value={reason}
          maxLength={200}
          placeholder="যেমন: নিয়মিত কাস্টমার, ভারী পণ্য"
          onChange={(e) => setReason(e.target.value)}
          className={inputClass}
        />
        {errors.reason && (
          <span className="mt-1 block text-sm text-red-600">{errors.reason}</span>
        )}
      </label>

      <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
        নতুন সাবটোটাল: {formatPrice(previewSubtotal)} · মোট:{" "}
        <span className="font-bold">{formatPrice(previewTotal)}</span>
      </p>

      {formError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>
      )}
      {done && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">{done}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
      </button>
    </form>
  );
}