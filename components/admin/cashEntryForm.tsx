"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createCashEntryAction } from "@/app/(admin)/admin/(panel)/cash/actions";
import { CASH_KINDS, CASH_KIND_LABELS, type CashKindKey } from "@/lib/cash-kind";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

const PAY_OPTIONS = [
  { value: "CASH", label: "নগদ (হাতে)" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "BANK", label: "ব্যাংক" },
];

export default function CashEntryForm({ today }: { today: string }) {
  const router = useRouter();
  const lock = useRef(false);
  const [kind, setKind] = useState<CashKindKey>("OPENING");
  const [method, setMethod] = useState("CASH");
  const [toMethod, setToMethod] = useState("CASH");
  const [amount, setAmount] = useState("");
  const [charge, setCharge] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const isTransfer = kind === "TRANSFER";

  function changeKind(k: CashKindKey) {
    setKind(k);
    // স্থানান্তরে সাধারণ ব্যবহার: ব্যাংক থেকে হাতে নগদ
    if (k === "TRANSFER") {
      setMethod("BANK");
      setToMethod("CASH");
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    if (
      kind === "OPENING" &&
      !window.confirm(
        "শুরুর জমা বসাবেন? এটা বদলানো যায় না, ভুল হলে বাতিল করে আবার বসাতে হবে।"
      )
    ) {
      return;
    }
    lock.current = true;
    setSaving(true);
    setError(null);
    setOkMsg(null);

    try {
      const result = await createCashEntryAction({
        kind,
        method,
        toMethod: isTransfer ? toMethod : "",
        amount,
        charge: isTransfer ? charge : "",
        date,
        note,
      });
      if (result.ok) {
        setAmount("");
        setCharge("");
        setNote("");
        setOkMsg("সংরক্ষণ হয়েছে।");
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
          <span className="mb-1 block text-xs font-medium text-gray-600">কী ধরনের এন্ট্রি</span>
          <select
            value={kind}
            onChange={(e) => changeKind(e.target.value as CashKindKey)}
            className={inputClass}
          >
            {CASH_KINDS.map((k) => (
              <option key={k} value={k}>
                {CASH_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            {isTransfer ? "যেখান থেকে টাকা যাচ্ছে" : "কোন মাধ্যম"}
          </span>
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
        {isTransfer && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              যেখানে টাকা যাচ্ছে
            </span>
            <select
              value={toMethod}
              onChange={(e) => setToMethod(e.target.value)}
              className={inputClass}
            >
              {PAY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
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
        {isTransfer && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              চার্জ (ঐচ্ছিক)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={charge}
              placeholder="০"
              onChange={(e) => setCharge(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            {kind === "OPENING" ? "চালুর তারিখ" : "তারিখ"}
          </span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
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

      {kind === "OPENING" && (
        <p className="text-xs text-gray-500">
          নতুন সিস্টেম চালুর দিনে ওই মাধ্যমে মোট যত টাকা আছে, তা লিখুন। ক্যাশ বুক এই তারিখ থেকে
          গোনা শুরু করবে।
        </p>
      )}
      {isTransfer && (
        <p className="text-xs text-gray-500">
          যেমন ব্যাংক থেকে ১০,০০০ তুলে হাতে নিলে: যেখান থেকে = ব্যাংক, যেখানে = নগদ, টাকা = ১০০০০।
          চার্জ কাটলে সেটা লিখুন, এটা নিজে থেকে খরচে যাবে (&quot;ব্যাংক ও মোবাইল ব্যাংকিং
          চার্জ&quot;), আর চার্জের টাকাও &quot;যেখান থেকে&quot; মাধ্যম থেকে বাদ যাবে।
        </p>
      )}

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {okMsg && <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{okMsg}</p>}

      <button
        type="submit"
        disabled={saving || !(Number(amount) > 0)}
        className="rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
      </button>
    </form>
  );
}