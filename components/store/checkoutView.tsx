"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import {
  clearCart,
  MAX_PER_ITEM,
  syncCartWithServer,
  useCart,
  useHydrated,
} from "@/lib/cart-store";
import {
  clearSavedCustomer,
  loadSavedCustomer,
  saveCustomer,
} from "@/lib/customer-memory";
import { formatPrice } from "@/lib/format";
import { imageUrl, isAllowedImageUrl } from "@/lib/images";
import { en } from "@/lib/messages";
import { getZoneFee, isZone, ZONES, type Zone } from "@/lib/shipping";
import {
  placeOrderAction,
  previewCartAction,
} from "@/app/(store)/checkout/actions";
import type { CartPreview } from "@/modules/orders/preview-cart";
import type { CustomerInput, FieldErrors } from "@/modules/orders/validation";

const EMPTY_FORM: CustomerInput = { name: "", phone: "", address: "", zone: "" };

const ZONE_TEXT: Record<Zone, string> = {
  dhaka: en.checkout.insideDhaka,
  outside: en.checkout.outsideDhaka,
};

const inputClass =
  "w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-3 text-base text-brand-teal placeholder:text-gray-500 focus:border-brand-blue";

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
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-brand-teal">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-sm font-semibold text-red-700">
          {error}
        </span>
      )}
    </label>
  );
}

export default function CheckoutView() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { items } = useCart();

  // আগের অর্ডারের তথ্য এই ডিভাইসে থাকলে ফর্ম আগে থেকেই ভরা থাকবে
  const [form, setForm] = useState<CustomerInput>(
    () => loadSavedCustomer() ?? EMPTY_FORM
  );
  const [remember, setRemember] = useState(true);
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
            found.push(en.checkout.gone(item.name));
          } else if (f.stock <= 0) {
            found.push(en.checkout.outOfStock(item.name));
          } else {
            if (item.quantity > Math.min(f.stock, MAX_PER_ITEM)) {
              found.push(en.checkout.reduced(item.name, f.stock));
            }
            if (f.price !== item.price) {
              found.push(en.checkout.priceChanged(item.name, formatPrice(f.price)));
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

  const imageById = new Map(items.map((i) => [i.variantId, i.image]));

  const subtotal = round2(buyLines.reduce((sum, l) => sum + l.price * l.quantity, 0));
  const shippingFee = isZone(form.zone) ? getZoneFee(form.zone) : null;
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
        // অর্ডার হয়ে গেলে পরের বারের জন্য তথ্য এই ডিভাইসে রাখি (বা মুছি)
        if (remember) saveCustomer(form);
        else clearSavedCustomer();

        setPlaced({ orderNumber: result.orderNumber, total: result.total });
        clearCart();
        router.push(`/order/success/${result.orderNumber}`);
        return;
      }

      setFormError(result.message);
      if (result.code === "INVALID_INPUT") {
        setErrors(result.fieldErrors);
      } else if (result.code !== "SERVER_ERROR" && result.code !== "RATE_LIMITED") {
        // দাম বা স্টক বদলেছে: নতুন করে সার্ভার থেকে দেখে নিই
        setRefreshTick((t) => t + 1);
      }
    } catch {
      setFormError(en.checkout.networkError);
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  const noticeBox =
    notices.length > 0 ? (
      <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
        <p className="font-semibold">{en.checkout.changed}</p>
        <ul className="mt-2 list-disc pl-5">
          {notices.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
    ) : null;

  if (placed) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <h2 className="font-heading text-xl font-semibold text-brand-teal">
          {en.checkout.received}
        </h2>
        <p className="mt-3 text-sm text-gray-800">
          {en.checkout.orderNumber}:{" "}
          <span className="font-mono font-bold">{placed.orderNumber}</span>
        </p>
        <p className="mt-3 text-sm text-gray-700">{en.checkout.opening}</p>
        <Link
          href={`/order/success/${placed.orderNumber}`}
          className="mt-4 inline-block text-sm font-semibold text-brand-blue underline"
        >
          {en.checkout.notOpening}
        </Link>
      </div>
    );
  }

  if (!hydrated) {
    return <p className="py-10 text-center text-gray-600">{en.checkout.loading}</p>;
  }

  if (items.length === 0) {
    return (
      <div>
        {noticeBox}
        <div className="py-16 text-center">
          <p className="text-lg text-gray-700">{en.checkout.empty}</p>
          <Link href="/products" className={`${buttonClass("primary", "lg")} mt-5`}>
            {en.checkout.startShopping}
          </Link>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-700">{en.checkout.loadFail}</p>
        <button
          type="button"
          onClick={() => {
            setLoadError(false);
            setRefreshTick((t) => t + 1);
          }}
          className={`${buttonClass("primary", "md")} mt-4`}
        >
          {en.checkout.retry}
        </button>
      </div>
    );
  }

  if (!preview) {
    return <p className="py-10 text-center text-gray-600">{en.checkout.verifying}</p>;
  }

  return (
    <div>
      {noticeBox}

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <h2 className="font-heading text-lg font-semibold text-brand-teal">
            {en.checkout.deliveryDetails}
          </h2>

          <Field label={en.checkout.name} error={errors.name}>
            <input
              type="text"
              name="name"
              value={form.name}
              maxLength={80}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              onChange={(e) => setField("name", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label={en.checkout.phone} error={errors.phone}>
            <input
              type="tel"
              name="phone"
              inputMode="tel"
              value={form.phone}
              maxLength={20}
              autoComplete="tel"
              placeholder={en.checkout.phonePlaceholder}
              aria-invalid={Boolean(errors.phone)}
              onChange={(e) => setField("phone", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label={en.checkout.address} error={errors.address}>
            <textarea
              name="address"
              value={form.address}
              maxLength={250}
              rows={3}
              autoComplete="street-address"
              placeholder={en.checkout.addressPlaceholder}
              aria-invalid={Boolean(errors.address)}
              onChange={(e) => setField("address", e.target.value)}
              className={inputClass}
            />
          </Field>

          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-brand-teal">
              {en.checkout.area}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {ZONES.map((z) => {
                const selected = form.zone === z;
                return (
                  <label
                    key={z}
                    className={[
                      "flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-lg border-2 px-4 py-3 focus-within:ring-2 focus-within:ring-brand-orange",
                      selected
                        ? "border-brand-blue bg-brand-mist"
                        : "border-gray-300 hover:border-brand-blue",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="zone"
                        value={z}
                        checked={selected}
                        onChange={() => setField("zone", z)}
                        className="h-5 w-5 accent-brand-blue"
                      />
                      <span className="font-semibold text-brand-teal">
                        {ZONE_TEXT[z]}
                      </span>
                    </span>
                    <span className="font-bold text-brand-teal">
                      {formatPrice(getZoneFee(z))}
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.zone && (
              <p role="alert" className="mt-1 text-sm font-semibold text-red-700">
                {errors.zone}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-700">{en.checkout.heavyNote}</p>
          </fieldset>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-5 w-5 accent-brand-blue"
            />
            {en.checkout.remember}
          </label>

          <div className="rounded-xl border border-gray-200 bg-brand-mist p-4 text-sm">
            <p className="font-semibold text-brand-teal">{en.checkout.payment}</p>
            <p className="mt-1 text-gray-800">
              <span className="font-semibold">{en.checkout.codTitle}</span> ·{" "}
              {en.checkout.codText}
            </p>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-4">
          <h2 className="font-heading text-lg font-semibold text-brand-teal">
            {en.checkout.summary}
          </h2>

          <ul className="mt-4 space-y-3 text-sm">
            {buyLines.map((l) => {
              const raw = imageById.get(l.variantId);
              const img = raw && isAllowedImageUrl(raw) ? raw : null;
              return (
                <li key={l.variantId} className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                    {img ? (
                      <img
                        src={imageUrl(img, 96)}
                        alt=""
                        width={48}
                        height={48}
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="font-bold text-gray-300">{l.name[0]}</span>
                    )}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block font-semibold text-brand-teal">
                      {l.name}
                    </span>
                    <span className="block text-xs text-gray-600">
                      {l.variantLabel} × {l.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-brand-teal">
                    {formatPrice(l.price * l.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">{en.checkout.subtotal}</span>
              <span className="font-semibold text-brand-teal">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">{en.checkout.delivery}</span>
              <span className="font-semibold text-brand-teal">
                {shippingFee === null ? en.checkout.chooseArea : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-brand-teal">
              <span>{en.checkout.total}</span>
              <span>{total === null ? "—" : formatPrice(total)}</span>
            </div>
          </div>

          {formError && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800"
            >
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || buyLines.length === 0}
            className={`${buttonClass("primary", "lg")} mt-5 w-full`}
          >
            {submitting ? en.checkout.placing : en.checkout.placeOrder}
          </button>

          <p className="mt-3 text-center text-sm">
            <Link href="/products" className="font-semibold text-brand-blue hover:underline">
              ← {en.cart.continueShopping}
            </Link>
          </p>
        </aside>
      </form>
    </div>
  );
}