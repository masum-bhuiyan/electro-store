"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";

type Suggestion = {
  name: string;
  slug: string;
  brandName: string;
  price: number;
};

export default function ProductFilters({ q }: { q?: string }) {
  const [text, setText] = useState(q ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // টাইপ করা থামার ২৫০ms পর সাজেশন আনি
  useEffect(() => {
    const term = text.trim();
    if (!term) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        setSuggestions(await res.json());
      } catch {
        // আগের অনুরোধ বাতিল হলে এখানে আসে, সমস্যা নেই
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

  // বক্সের বাইরে ক্লিক করলে তালিকা বন্ধ
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showList = open && text.trim().length > 0 && suggestions.length > 0;

  return (
    <form
      action="/products"
      method="get"
      className="mb-6 flex flex-col gap-3 sm:flex-row"
    >
      <div ref={boxRef} className="relative flex-1">
        <input
          type="search"
          name="q"
          value={text}
          maxLength={50}
          autoComplete="off"
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="প্রোডাক্টের নাম লিখুন"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        {showList && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
            {suggestions.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/products/${s.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span>
                    <span className="block font-medium">{s.name}</span>
                    <span className="block text-xs text-gray-500">
                      {s.brandName}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium">
                    {formatPrice(s.price)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          খুঁজুন
        </button>
        {q && (
          <Link
            href="/products"
            onClick={() => setText("")}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            মুছে ফেলুন
          </Link>
        )}
      </div>
    </form>
  );
}