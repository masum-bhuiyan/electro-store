"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { DIVISIONS, getShippingFee, isDivision } from "@/lib/shipping";
import {
  clearCart,
  MAX_PER_ITEM,
  syncCartWithServer,
  useCart,
  useHydrated,
} from "@/lib/cart-store";
import {
  placeOrderAction,
  previewCartAction,
} from "@/app/(store)/checkout/actions";
import type { CartPreview } from "@/modules/orders/preview-cart";
import type { CustomerInput, FieldErrors } from "@/modules/orders/validation";

const EMPTY_FORM: CustomerInput = {
  name: "",
  phone: "",
  division: "",
  district: "",
  area: "",
  details: "",
  notes: "",
};

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

const round2 = (n: number) => Math.round(n * 100) / 100;

// প্রতিটা অর্ডার চেষ্টার গোপন কোড। http-তে crypto.randomUUID না থাকলে বিকল্প
function makeKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function Field({
  label,
  error,
  optional,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {optional && <span className="ml-1 font-normal text-gray-400">(ঐচ্ছিক)</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

export default function CheckoutView() {
  const hydrated = useHydrated();
  const { items } = useCart();

  const [form, setForm] = useState<CustomerInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [preview, setPreview] = useState<CartPreview | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [notices, setNotices] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<{ orderNumber: string; total: number } | null>(
    null
  );

  const submitLock = useRef(false);
  const keyRef = useRef<string | null>(null);

  // সার্ভার থেকে কার্টের আসল দাম ও স্টক আনি, বদল থাকলে কার্ট ঠিক করি ও ক্রেতাকে জানাই
  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    let cancelled = false;

    previewCartAction(
      items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))
    )
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setLoadError(true);
          return;
        }

        const freshById = new Map(result.lines.map((l) => [l.variantId, l]));
        const found: string[] = [];

        for (const item of items) {
          const f = freshById.get(item.variantId);
          if (!f) {
            found.push(`"${item.name}" আর পাওয়া যায় না, কার্ট থেকে সরানো হয়েছে।`);
          } else if (f.stock <= 0) {
            found.push(`"${item.name}" এখন স্টকে নেই, কার্ট থেকে সরানো হয়েছে।`);
          } else {
            if (item.quantity > Math.min(f.stock, MAX_PER_ITEM)) {
              found.push(
                `"${item.name}" এর স্টকে মাত্র ${f.stock}টি আছে, সংখ্যা কমানো হয়েছে।`
              );
            }
            if (f.price !== item.price) {
              found.push(
                `"${item.name}" এর দাম বদলে ${formatPrice(f.price)} হয়েছে।`
              );
            }
          }
        }

        setPreview(result);

        if (found.length > 0) {
          setNotices((prev) => [...prev, ...found]);
          syncCartWithServer(
            result.lines.map((l) => ({
              variantId: l.variantId,
              price: l.price,
              stock: l.stock,
            })),
            result.missing
          );
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, items, refreshTick]);

  // যা সত্যিই কেনা যাবে: সার্ভারের দাম, আর সংখ্যা স্টকের মধ্যে আটকানো
  const buyLines = preview
    ? preview.lines
        .map((l) => ({
          ...l,
          quantity: Math.min(l.requested, l.stock, MAX_PER_ITEM),
        }))
        .filter((l) => l.quantity > 0)
    : [];

  const subtotal = round2(buyLines.reduce((sum, l) => sum + l.price * l.quantity, 0));
  const shippingFee = isDivision(form.division) ? getShippingFee(form.division) : null;
  const total = shippingFee === null ? null : round2(subtotal + shippingFee);

  function setField(name: keyof CustomerInput, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current || buyLines.length === 0) return;

    submitLock.current = true;
    setSubmitting(true);
    setFormError(null);
    setErrors({});

    try {
      if (!keyRef.current) keyRef.current = makeKey();

      const result = await placeOrderAction({
        customer: form,
        items: buyLines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        expectedSubtotal: subtotal,
        idempotencyKey: keyRef.current,
      });

      if (result.ok) {
        setPlaced({ orderNumber: result.orderNumber, total: result.total });
        clearCart();
        return;
      }

      setFormError(result.message);
      if (result.code === "INVALID_INPUT") {
        setErrors(result.fieldErrors);
      } else if (result.code !== "SERVER_ERROR") {
        // দাম বা স্টক বদলেছে: নতুন করে সার্ভার থেকে দেখে নিই
        setRefreshTick((t) => t + 1);
      }
    } catch {
      setFormError("সংযোগে সমস্যা হয়েছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  const noticeBox =
    notices.length > 0 ? (
      <div className="mb-6 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
        <p className="font-medium">কার্টে কিছু পরিবর্তন হয়েছে:</p>
        <ul className="mt-2 list-disc pl-5">
          {notices.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
    ) : null;

  if (placed) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-4xl">✅</p>
        <h2 className="mt-3 text-xl font-bold">আপনার অর্ডার গ্রহণ করা হয়েছে</h2>
        <p className="mt-4 text-sm text-gray-700">অর্ডার নম্বর</p>
        <p className="font-mono text-2xl font-bold">{placed.orderNumber}</p>
        <p className="mt-3 text-sm text-gray-700">
          মোট {formatPrice(placed.total)} · ক্যাশ অন ডেলিভারি
        </p>
        <p className="mt-4 text-sm text-gray-600">
          নম্বরটি লিখে রাখুন বা স্ক্রিনশট নিন। পেজ রিফ্রেশ করলে এটি আর দেখা যাবে না।
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          কেনাকাটা চালিয়ে যান
        </Link>
      </div>
    );
  }

  if (!hydrated) {
    return <p className="py-10 text-center text-gray-400">লোড হচ্ছে...</p>;
  }

  if (items.length === 0) {
    return (
      <div>
        {noticeBox}
        <div className="py-16 text-center">
          <p className="text-lg text-gray-600">চেকআউটের জন্য কার্টে কিছু নেই।</p>
          <Link
            href="/products"
            className="mt-4 inline-block rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            কেনাকাটা শুরু করুন
          </Link>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-600">কার্টের তথ্য আনা যায়নি।</p>
        <button
          type="button"
          onClick={() => {
            setLoadError(false);
            setRefreshTick((t) => t + 1);
          }}
          className="mt-4 rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (!preview) {
    return <p className="py-10 text-center text-gray-400">কার্ট যাচাই হচ্ছে...</p>;
  }

  return (
    <div>
      {noticeBox}

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-bold">ডেলিভারির তথ্য</h2>

          <Field label="আপনার নাম" error={errors.name}>
            <input
              type="text"
              value={form.name}
              maxLength={80}
              autoComplete="name"
              onChange={(e) => setField("name", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="মোবাইল নম্বর" error={errors.phone}>
            <input
              type="tel"
              inputMode="tel"
              value={form.phone}
              maxLength={20}
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              onChange={(e) => setField("phone", e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="বিভাগ" error={errors.division}>
              <select
                value={form.division}
                onChange={(e) => setField("division", e.target.value)}
                className={inputClass}
              >
                <option value="">বিভাগ বাছাই করুন</option>
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="জেলা" error={errors.district}>
              <input
                type="text"
                value={form.district}
                maxLength={50}
                onChange={(e) => setField("district", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="এলাকা / থানা" error={errors.area}>
            <input
              type="text"
              value={form.area}
              maxLength={80}
              onChange={(e) => setField("area", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="বিস্তারিত ঠিকানা" error={errors.details}>
            <textarea
              value={form.details}
              maxLength={200}
              rows={3}
              placeholder="বাসা/রোড/গ্রাম, ল্যান্ডমার্ক"
              onChange={(e) => setField("details", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="অর্ডারের নোট" error={errors.notes} optional>
            <textarea
              value={form.notes}
              maxLength={300}
              rows={2}
              onChange={(e) => setField("notes", e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="font-medium">পেমেন্ট পদ্ধতি</p>
            <p className="mt-1 text-gray-700">
              ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা দিন)
            </p>
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold">অর্ডারের সারসংক্ষেপ</h2>

          <ul className="mt-4 space-y-3 text-sm">
            {buyLines.map((l) => (
              <li key={l.variantId} className="flex justify-between gap-3">
                <span>
                  <span className="block font-medium">{l.name}</span>
                  <span className="block text-xs text-gray-500">
                    {l.variantLabel} × {l.quantity}
                  </span>
                </span>
                <span className="shrink-0">{formatPrice(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">সাবটোটাল</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ডেলিভারি চার্জ</span>
              <span>
                {shippingFee === null ? "বিভাগ বাছাই করুন" : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>মোট</span>
              <span>{total === null ? "—" : formatPrice(total)}</span>
            </div>
          </div>

          {formError && (
            <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || buyLines.length === 0}
            className="mt-5 w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
          >
            {submitting ? "অর্ডার হচ্ছে..." : "অর্ডার নিশ্চিত করুন"}
          </button>

          <p className="mt-3 text-center text-xs text-gray-500">
            <Link href="/cart" className="underline">
              কার্টে ফিরে যান
            </Link>
          </p>
        </aside>
      </form>
    </div>
  );
}