"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { saveClosingAction } from "@/app/(admin)/admin/(panel)/closing/actions";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

export type ClosingFormCard = {
  method: string;
  label: string;
  notStarted: boolean;
  system: number;
  // আগের সমাপ্তি থাকলে তার মান
  counted: string;
  reason: string;
};

function taka(n: number): string {
  return `৳${(Math.round(n * 100) / 100).toLocaleString("en-US")}`;
}

export default function ClosingForm({
  date,
  cards,
  hasExisting,
}: {
  date: string;
  cards: ClosingFormCard[];
  hasExisting: boolean;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [counted, setCounted] = useState<Record<string, string>>(
    Object.fromEntries(cards.map((c) => [c.method, c.counted]))
  );
  const [reasons, setReasons] = useState<Record<string, string>>(
    Object.fromEntries(cards.map((c) => [c.method, c.reason]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const active = cards.filter((c) => !c.notStarted);

  function diffOf(c: ClosingFormCard): number | null {
    const t = (counted[c.method] ?? "").trim();
    if (t === "" || !/^\d+(\.\d{1,2})?$/.test(t)) return null;
    return Math.round((Number(t) - c.system) * 100) / 100;
  }

  const allFilled = active.every((c) => diffOf(c) !== null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current || !allFilled) return;
    if (
      hasExisting &&
      !window.confirm("এই দিনের সমাপ্তি আগেই দেওয়া আছে। নতুনটা দিলে আগেরটা বাতিল হয়ে যাবে। চালিয়ে যাবেন?")
    ) {
      return;
    }
    lock.current = true;
    setSaving(true);
    setError(null);
    setOkMsg(null);

    try {
      const result = await saveClosingAction({
        date,
        lines: active.map((c) => ({
          method: c.method,
          counted: counted[c.method] ?? "",
          reason: reasons[c.method] ?? "",
        })),
      });
      if (result.ok) {
        setOkMsg("দৈনিক সমাপ্তি সংরক্ষণ হয়েছে।");
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
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {cards.map((c) => {
          const diff = diffOf(c);
          return (
            <div key={c.method} className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="font-semibold">{c.label}</p>
              {c.notStarted ? (
                <p className="mt-2 text-sm text-gray-500">
                  এই তারিখে এই মাধ্যমের হিসাব শুরু হয়নি, গোনা লাগবে না।
                </p>
              ) : (
                <div className="mt-2 space-y-3">
                  <p className="text-sm">
                    সিস্টেমের হিসাব: <b>{taka(c.system)}</b>
                  </p>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">
                      আসলে কত আছে (গুনে বা অ্যাপ দেখে)
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={counted[c.method] ?? ""}
                      onChange={(e) => setCounted({ ...counted, [c.method]: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                  {diff !== null && (
                    <p
                      className={`text-sm font-medium ${
                        diff === 0 ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {diff === 0
                        ? "ঠিক মিলেছে ✓"
                        : diff < 0
                          ? `${taka(-diff)} কম আছে`
                          : `${taka(diff)} বেশি আছে`}
                    </p>
                  )}
                  {diff !== null && diff !== 0 && (
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-gray-600">
                        পার্থক্যের কারণ (বাধ্যতামূলক)
                      </span>
                      <input
                        type="text"
                        maxLength={300}
                        value={reasons[c.method] ?? ""}
                        onChange={(e) => setReasons({ ...reasons, [c.method]: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">
        পার্থক্যের জন্য ক্যাশবুকে নিজে থেকে কিছু যোগ হয় না। ভুল খুঁজে পেলে খরচ বা এন্ট্রি লিখে ঠিক করুন, তারপর
        আবার সমাপ্তি দিন।
      </p>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {okMsg && <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{okMsg}</p>}

      <button
        type="submit"
        disabled={saving || !allFilled || active.length === 0}
        className="rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {saving ? "সংরক্ষণ হচ্ছে..." : hasExisting ? "সমাপ্তি আবার দিন" : "দিনের সমাপ্তি দিন"}
      </button>
    </form>
  );
}