"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type Props = {
  placeholder: string;
  // ২ অক্ষর (অঙ্ক হলে ৩) থেকে খোঁজা শুরু
  param?: string;
};

export default function LiveSearchBox({ placeholder, param = "q" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const urlValue = searchParams.get(param) ?? "";
  const [value, setValue] = useState(urlValue);
  const counter = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    // পেজ প্রথমবার খোলার সময় কিছু করা লাগবে না
    if (first.current) {
      first.current = false;
      return;
    }
    const term = value.trim();
    const isDigits = /^[\d\s+\-]+$/.test(term);
    const min = isDigits ? 3 : 2;
    // ফাঁকা করলে ফিল্টার তুলে দিই। ১ অক্ষর হলে আগের অবস্থায় থাকে
    if (term.length > 0 && term.length < min) return;
    if (term === urlValue.trim()) return;

    const myId = ++counter.current;
    const timer = setTimeout(() => {
      if (myId !== counter.current) return;
      const p = new URLSearchParams(searchParams.toString());
      if (term) p.set(param, term);
      else p.delete(param);
      p.delete("page");
      const query = p.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative mb-4">
      <input
        type="search"
        value={value}
        maxLength={50}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
      />
      {pending && (
        <span className="absolute right-3 top-2.5 text-xs text-gray-400">
          খোঁজা হচ্ছে...
        </span>
      )}
    </div>
  );
}