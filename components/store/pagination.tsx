import Link from "next/link";
import { en } from "@/lib/messages";

type Props = {
  page: number;
  totalPages: number;
  // বর্তমান সার্চ/ফিল্টারের শর্ত, যাতে পেজ বদলালে ওগুলো হারিয়ে না যায়
  params: Record<string, string>;
  // কোন পেজের লিংক বানাব; না দিলে /products
  basePath?: string;
};

// ১ ... ৪ ৫ ৬ ... ১০ ধরনের ছোট তালিকা
function pageList(page: number, total: number): (number | "…")[] {
  const wanted = [1, total, page - 1, page, page + 1].filter(
    (n) => n >= 1 && n <= total
  );
  const nums = [...new Set(wanted)].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

const box =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-lg border-2 px-3 text-sm font-semibold transition-colors";

export default function Pagination({
  page,
  totalPages,
  params,
  basePath = "/products",
}: Props) {
  if (totalPages <= 1) return null;

  function hrefFor(target: number): string {
    const sp = new URLSearchParams(params);
    if (target > 1) sp.set("page", String(target));
    const query = sp.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <nav
      aria-label={en.pagination.label}
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          className={`${box} border-gray-300 text-brand-teal hover:border-brand-blue`}
        >
          ← {en.pagination.prev}
        </Link>
      )}

      {pageList(page, totalPages).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-gray-500">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-current={n === page ? "page" : undefined}
            className={
              n === page
                ? `${box} border-brand-teal bg-brand-teal text-white`
                : `${box} border-gray-300 text-brand-teal hover:border-brand-blue`
            }
          >
            {n}
          </Link>
        )
      )}

      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          className={`${box} border-gray-300 text-brand-teal hover:border-brand-blue`}
        >
          {en.pagination.next} →
        </Link>
      )}
    </nav>
  );
}