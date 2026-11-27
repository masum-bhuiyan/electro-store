"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Key = "today" | "yesterday" | "week" | "month" | "custom";

const OPTIONS: { value: Key; label: string }[] = [
  { value: "today", label: "আজ" },
  { value: "yesterday", label: "গতকাল" },
  { value: "week", label: "গত ৭ দিন" },
  { value: "month", label: "এই মাস" },
  { value: "custom", label: "কাস্টম তারিখ" },
];

const field =
  "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-blue focus:outline-none";

export default function DashboardRange({
  current,
  from,
  to,
  today,
}: {
  current: Key;
  from: string;
  to: string;
  today: string;
}) {
  const router = useRouter();
  const [key, setKey] = useState<Key>(current);
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  function onSelect(v: Key) {
    setKey(v);
    if (v !== "custom") router.push(`/admin?range=${v}`);
  }

  function applyCustom() {
    if (!f || !t) return;
    router.push(`/admin?range=custom&from=${f}&to=${t}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={key}
        onChange={(e) => onSelect(e.target.value as Key)}
        aria-label="সময় বাছুন"
        className={`${field} font-medium`}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {key === "custom" && (
        <>
          <input
            type="date"
            value={f}
            max={today}
            onChange={(e) => setF(e.target.value)}
            className={field}
          />
          <span className="text-sm text-gray-500">থেকে</span>
          <input
            type="date"
            value={t}
            max={today}
            onChange={(e) => setT(e.target.value)}
            className={field}
          />
          <button
            type="button"
            onClick={applyCustom}
            className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            দেখুন
          </button>
        </>
      )}
    </div>
  );
}