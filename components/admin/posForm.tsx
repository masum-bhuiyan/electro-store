"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  checkBelowCostAction,
  createSaleAction,
  lookupSaleCustomerAction,
  searchSaleCustomersAction,
} from "@/app/(admin)/admin/(panel)/sales/actions";
import {
  CUSTOMER_TYPES,
  CUSTOMER_TYPE_LABELS,
  customerTypeLabel,
  nameLabel,
  type CustomerTypeKey,
} from "@/lib/customer-type";
import type { SaleCustomerRow, SaleVariantRow } from "@/modules/sales/search";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

type Line = SaleVariantRow & { quantity: string; unitPrice: string };

const PAY_OPTIONS = [
  { value: "CASH", label: "নগদ" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "BANK", label: "ব্যাংক" },
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function taka(n: number): string {
  return `৳${round2(n).toLocaleString("en-US")}`;
}

export default function PosForm({
  canViewCost,
  catalog,
}: {
  canViewCost: boolean;
  catalog: SaleVariantRow[];
}) {
  const router = useRouter();
  const submitLock = useRef(false);
  const customerCounter = useRef(0);
  const phoneCounter = useRef(0);
  const lossCounter = useRef(0);
  const scanRef = useRef<HTMLInputElement>(null);

  // ক্রেতা
  const [customer, setCustomer] = useState<SaleCustomerRow | null>(null);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custType, setCustType] = useState<CustomerTypeKey>("RETAIL");
  const [nameResults, setNameResults] = useState<SaleCustomerRow[]>([]);
  const [phoneNotFound, setPhoneNotFound] = useState(false);

  // পণ্য
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [lossIds, setLossIds] = useState<string[]>([]);

  // পেমেন্ট
  const [paid, setPaid] = useState<string | null>(null); // null = পুরো টাকা
  const [payMethod, setPayMethod] = useState("CASH");
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const phoneDigits = custPhone.replace(/\D/g, "");

  // ফোন নম্বর পূরণ হলে পুরনো ক্রেতা খোঁজা
  useEffect(() => {
    if (customer || phoneDigits.length < 11) {
      setPhoneNotFound(false);
      return;
    }
    const myId = ++phoneCounter.current;
    const timer = setTimeout(async () => {
      try {
        const found = await lookupSaleCustomerAction(custPhone);
        if (myId !== phoneCounter.current) return;
        if (found) {
          setCustomer(found);
          setCustName("");
          setCustPhone("");
          setNameResults([]);
          setPhoneNotFound(false);
        } else {
          setPhoneNotFound(true);
        }
      } catch {
        if (myId === phoneCounter.current) setPhoneNotFound(false);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custPhone, customer]);

  // নাম লিখলে মিল থাকা ক্রেতার তালিকা
  useEffect(() => {
    const term = custName.trim();
    if (customer || term.length < 2) {
      setNameResults([]);
      return;
    }
    const myId = ++customerCounter.current;
    const timer = setTimeout(async () => {
      try {
        const rows = await searchSaleCustomersAction(term);
        if (myId === customerCounter.current) setNameResults(rows);
      } catch {
        if (myId === customerCounter.current) setNameResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [custName, customer]);

  // দাম বদলালে সার্ভারকে জিজ্ঞেস: কোনটা কেনা দামের নিচে
  const priceKey = lines.map((l) => `${l.id}:${l.unitPrice}`).join("|");
  useEffect(() => {
    if (lines.length === 0) {
      setLossIds([]);
      return;
    }
    const myId = ++lossCounter.current;
    const timer = setTimeout(async () => {
      try {
        const ids = await checkBelowCostAction(
          lines.map((l) => ({ variantId: l.id, unitPrice: l.unitPrice }))
        );
        if (myId === lossCounter.current) setLossIds(ids);
      } catch {
        // সতর্কতা না এলেও বিক্রি আটকাবে না
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceKey]);

  // ব্রাউজারেই তাৎক্ষণিক খোঁজা
  const results = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    return catalog.filter((c) => words.every((w) => c.search.includes(w))).slice(0, 8);
  }, [query, catalog]);

  function addLine(row: SaleVariantRow) {
    if (row.stock < 1) {
      setScanMsg(`"${row.name}": স্টক নেই।`);
      return;
    }
    const existing = lines.find((l) => l.id === row.id);
    if (existing) {
      const next = (Number(existing.quantity) || 0) + 1;
      if (next > row.stock) {
        setScanMsg(`"${row.name}": স্টকে মাত্র ${row.stock}টি আছে।`);
        return;
      }
      setLines((prev) =>
        prev.map((l) => (l.id === row.id ? { ...l, quantity: String(next) } : l))
      );
    } else {
      setLines((prev) => [
        ...prev,
        { ...row, quantity: "1", unitPrice: String(row.price) },
      ]);
    }
    setScanMsg(null);
    setQuery("");
    scanRef.current?.focus();
  }

  // স্ক্যানার কোড টাইপ করে Enter চাপে: SKU বা বারকোড মিললে সরাসরি যোগ
  function handleScanKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const code = query.trim().toLowerCase();
    if (!code) return;

    const exact = catalog.find(
      (c) => c.sku.toLowerCase() === code || (c.barcode && c.barcode.toLowerCase() === code)
    );
    const pick = exact ?? (results.length === 1 ? results[0] : null);

    if (pick) {
      addLine(pick);
    } else if (results.length > 1) {
      setScanMsg("একাধিক পণ্য মিলেছে, তালিকা থেকে বাছুন।");
    } else {
      setScanMsg("কোনো পণ্য পাওয়া যায়নি।");
    }
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
      (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
      0
    )
  );
  const paidValue = paid === null ? String(total) : paid;
  const paidNumber = Number(paidValue) || 0;
  const due = round2(total - paidNumber);
  const hasCustomer = customer !== null || phoneDigits.length >= 11;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current) return;

    submitLock.current = true;
    setSaving(true);
    setFormError(null);

    const payload = {
      customerId: customer?.id ?? "",
      customerType: customer ? customer.type : custType,
      newName: customer ? "" : custName,
      newPhone: customer ? "" : custPhone,
      newType: custType,
      note,
      payMethod,
      paid: paidValue,
      items: lines.map((l) => ({
        variantId: l.id,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
    };

    let navigated = false;
    try {
      const result = await createSaleAction(payload);
      if (result.ok) {
        navigated = true;
        router.push("/admin/sales?saved=1");
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
      {/* ক্রেতা */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="mb-2 text-sm font-medium text-gray-700">ক্রেতা</p>

        {customer ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-blue-50 p-3 text-sm">
            <div>
              <p className="font-medium">
                {customer.name}{" "}
                <span className="text-xs font-normal text-gray-600">
                  ({customerTypeLabel(customer.type)})
                </span>
              </p>
              <p className="text-xs text-gray-600">
                {customer.contactName && <>{customer.contactName} · </>}
                {customer.phone}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCustomer(null)}
              className="text-sm text-blue-600 hover:underline"
            >
              বদলান
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">
                  {nameLabel(custType)}
                </span>
                <input
                  type="text"
                  value={custName}
                  maxLength={80}
                  onChange={(e) => setCustName(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">
                  মোবাইল নম্বর
                </span>
                <input
                  type="text"
                  inputMode="tel"
                  value={custPhone}
                  maxLength={20}
                  placeholder="01XXXXXXXXX"
                  onChange={(e) => setCustPhone(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">ধরন</span>
                <select
                  value={custType}
                  onChange={(e) => setCustType(e.target.value as CustomerTypeKey)}
                  className={inputClass}
                >
                  {CUSTOMER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {CUSTOMER_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {nameResults.length > 0 && (
              <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
                {nameResults.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomer(c);
                        setCustName("");
                        setCustPhone("");
                        setNameResults([]);
                      }}
                      className="flex w-full justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-blue-50"
                    >
                      <span>
                        {c.name}
                        <span className="ml-2 text-xs text-gray-500">
                          {customerTypeLabel(c.type)}
                        </span>
                      </span>
                      <span className="text-xs text-gray-500">{c.phone}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {phoneNotFound ? (
              <p className="text-sm text-green-700">
                {custName.trim().length >= 2
                  ? "এই নম্বরে পুরনো ক্রেতা নেই। বিক্রয় সেভ করলে নতুন ক্রেতা হিসেবে জমা হবে।"
                  : "এই নম্বরে পুরনো ক্রেতা নেই। নতুন ক্রেতা হিসেবে জমা করতে নাম লিখুন।"}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                নম্বর দিলেই পুরনো ক্রেতা অটো আসবে। নাম ও নম্বর ফাঁকা রাখলে walk-in (সরাসরি নগদ ক্রেতা)।
              </p>
            )}
          </div>
        )}
      </div>

      {/* পণ্য খোঁজা / স্ক্যান */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            পণ্য খুঁজুন বা বারকোড স্ক্যান করুন (নাম, SKU, বারকোড বা ব্র্যান্ড)
          </span>
          <input
            ref={scanRef}
            type="text"
            autoFocus
            value={query}
            maxLength={60}
            placeholder="লিখুন অথবা স্ক্যান করুন"
            onChange={(e) => {
              setQuery(e.target.value);
              setScanMsg(null);
            }}
            onKeyDown={handleScanKey}
            className={inputClass}
          />
        </label>

        {scanMsg && <p className="mt-2 text-sm text-red-600">{scanMsg}</p>}

        {results.length > 0 && (
          <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  disabled={r.stock < 1}
                  onClick={() => addLine(r)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <span>
                    {r.name}
                    <span className="ml-2 text-xs text-gray-500">{r.sku}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {r.stock < 1 ? "স্টক নেই" : `স্টক ${r.stock}`} · {taka(r.price)}
                    {lines.some((l) => l.id === r.id) && " · যোগ করা"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim() !== "" && results.length === 0 && !scanMsg && (
          <p className="mt-2 text-sm text-gray-500">কোনো পণ্য পাওয়া যায়নি।</p>
        )}
      </div>

      {/* পণ্যের লাইন */}
      {lines.length > 0 && (
        <div className="space-y-3">
          {lines.map((l) => {
            const qty = Number(l.quantity) || 0;
            const unit = Number(l.unitPrice) || 0;
            const discount = l.price > 0 ? ((l.price - unit) / l.price) * 100 : 0;
            const isLoss = lossIds.includes(l.id);
            const lossAmount =
              canViewCost && l.costPrice !== null && unit < l.costPrice
                ? round2((l.costPrice - unit) * qty)
                : null;

            return (
              <div key={l.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{l.name}</p>
                    <p className="text-xs text-gray-500">
                      {l.sku} · স্টক {l.stock} · আসল দাম {taka(l.price)}
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
                      বিক্রয় দাম (প্রতিটি)
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={l.unitPrice}
                      onChange={(e) => updateLine(l.id, { unitPrice: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                  <div className="flex flex-col justify-end pb-2 text-sm">
                    <p className="text-gray-600">
                      লাইন মোট: <span className="font-medium">{taka(qty * unit)}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-sm">
                  {Math.abs(discount) >= 0.05 && (
                    <p className="text-gray-600">
                      {discount > 0
                        ? `ছাড়: ${discount.toFixed(1)}%`
                        : `আসল দামের চেয়ে ${Math.abs(discount).toFixed(1)}% বেশি`}
                    </p>
                  )}
                  {isLoss && (
                    <p className="font-medium text-red-600">
                      {lossAmount !== null
                        ? `সতর্কতা: কেনা দামের চেয়ে ${taka(lossAmount)} কম, লোকসান হচ্ছে।`
                        : "সতর্কতা: এই দামে লোকসান হচ্ছে।"}
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
            মোট: <span className="text-lg font-bold">{taka(total)}</span>
          </p>
          <p className={due > 0 ? "text-red-600" : "text-gray-700"}>
            বাকি: <span className="font-bold">{taka(due)}</span>
          </p>
          {due > 0 && !hasCustomer && (
            <p className="text-xs text-red-600">
              বাকিতে বিক্রি করতে ক্রেতার মোবাইল নম্বর দিন।
            </p>
          )}
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              এখন কত টাকা পেলেন
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={paidValue}
              onChange={(e) => setPaid(e.target.value)}
              className={inputClass}
            />
            {paid !== null && (
              <button
                type="button"
                onClick={() => setPaid(null)}
                className="mt-1 text-xs text-blue-600 hover:underline"
              >
                পুরো টাকা ধরুন
              </button>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">পেমেন্টের মাধ্যম</span>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
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
        disabled={saving || lines.length === 0}
        className="rounded-md bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : "বিক্রয় সংরক্ষণ করুন"}
      </button>
    </form>
  );
}