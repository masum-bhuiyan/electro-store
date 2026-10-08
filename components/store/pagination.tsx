import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  // বর্তমান সার্চ/ফিল্টারের শর্ত, যাতে পেজ বদলালে ওগুলো হারিয়ে না যায়
  params: Record<string, string>;
};

export default function Pagination({ page, totalPages, params }: Props) {
  if (totalPages <= 1) return null;

  function hrefFor(target: number): string {
    const sp = new URLSearchParams(params);
    if (target > 1) sp.set("page", String(target));
    const query = sp.toString();
    return query ? `/products?${query}` : "/products";
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          className="rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50"
        >
          ← আগের
        </Link>
      )}

      {pages.map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          className={
            n === page
              ? "rounded-md bg-blue-600 px-3 py-2 font-medium text-white"
              : "rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50"
          }
        >
          {n}
        </Link>
      ))}

      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          className="rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50"
        >
          পরের →
        </Link>
      )}
    </nav>
  );
}