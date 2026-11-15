"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { formatPrice } from "@/lib/format";
import { en } from "@/lib/messages";

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

  // টাইপ করা থামার ৫০ms পর সাজেশন আনি
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
    }, 50);

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
      role="search"
      className="mb-6 flex flex-col gap-3 sm:flex-row"
    >
      <div ref={boxRef} className="relative flex-1">
        <label htmlFor="product-search" className="sr-only">
          {en.list.searchLabel}
        </label>
        <Icon
          name="search"
          size={20}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          id="product-search"
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
          placeholder={en.list.searchPlaceholder}
          className="h-12 w-full rounded-lg border-2 border-gray-300 bg-white pl-10 pr-3 text-base text-brand-teal placeholder:text-gray-500 focus:border-brand-blue"
        />

        {showList && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            {suggestions.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/products/${s.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center justify-between gap-3 px-3 py-2 hover:bg-brand-mist"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-brand-teal">
                      {s.name}
                    </span>
                    <span className="block text-xs font-semibold text-brand-blue">
                      {s.brandName}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-brand-teal">
                    {formatPrice(s.price)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-brand-teal px-6 text-base font-bold text-white transition hover:brightness-125"
        >
          {en.list.search}
        </button>
        {q && (
          <Link
            href="/products"
            onClick={() => setText("")}
            className="text-sm font-semibold text-gray-600 underline hover:text-brand-blue"
          >
            {en.list.clear} 
          </Link>
        )}
      </div>
    </form>
  );
}