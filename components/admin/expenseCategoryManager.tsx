"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  createExpenseCategoryAction,
  setExpenseCategoryActiveAction,
} from "@/app/(admin)/admin/(panel)/expenses/actions";

export default function ExpenseCategoryManager({
  categories,
}: {
  categories: { id: string; name: string; isActive: boolean }[];
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await fn();
      if (result.ok) {
        setName("");
        router.refresh();
      } else {
        setError(result.message ?? "হয়নি।");
      }
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(() => createExpenseCategoryAction(name));
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          type="text"
          value={name}
          maxLength={40}
          placeholder="নতুন ক্যাটাগরির নাম"
          onChange={(e) => setName(e.target.value)}
          className="min-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || name.trim().length < 2}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          যোগ করুন
        </button>
      </form>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <ul className="divide-y divide-gray-200 text-sm">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2">
            <span className={c.isActive ? "" : "text-gray-400 line-through"}>{c.name}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(() => setExpenseCategoryActiveAction(c.id, !c.isActive))}
              className="text-xs text-blue-600 hover:underline disabled:text-gray-400"
            >
              {c.isActive ? "বন্ধ করুন" : "চালু করুন"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}