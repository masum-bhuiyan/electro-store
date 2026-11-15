import type { Metadata } from "next";
import Link from "next/link";
import Pagination from "@/components/store/pagination";
import ProductCard from "@/components/store/productCard";
import ProductFilters from "@/components/store/productFilters";
import { en } from "@/lib/messages";
import { SHOP_NAME } from "@/lib/site";
import { getStoreCategories } from "@/modules/catalog/queries";
import { getProducts } from "@/modules/products/queries";

// আপাতত প্রতিবার ডাটাবেস থেকে নতুন ডাটা আনবে। ক্যাশিং পরে।
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// URL-এ একই নাম দুইবার থাকলে (?q=a&q=b) প্রথমটা নিই
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// সার্চ রেজাল্ট পেজ গুগলে আসবে না (noindex); সাধারণ তালিকা আসবে
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const q = first(sp.q)?.trim().slice(0, 50);

  if (q) {
    return {
      title: `${en.list.resultsFor(q)} | ${SHOP_NAME}`,
      robots: { index: false, follow: true },
    };
  }
  return {
    title: `${en.list.title} | ${SHOP_NAME}`,
    description: en.list.metaDescription,
  };
}

const chip =
  "inline-flex min-h-11 items-center rounded-lg border-2 px-4 text-sm font-semibold transition-colors";

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const q = first(sp.q)?.trim() || undefined;
  const pageNumber = Math.floor(Number(first(sp.page))) || 1;

  const [categories, { items, total, page, totalPages }] = await Promise.all([
    getStoreCategories(),
    getProducts({ q, page: pageNumber }),
  ]);

  // পেজ নম্বরের লিংকে সার্চ ধরে রাখার জন্য
  const params: Record<string, string> = {};
  if (q) params.q = q;

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-semibold text-brand-teal md:text-3xl">
        {q ? en.list.resultsFor(q) : en.list.title}
      </h1>

      <ProductFilters q={q} />

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <span className={`${chip} border-brand-teal bg-brand-teal text-white`}>
            {en.category.all}
          </span>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className={`${chip} border-gray-300 text-brand-teal hover:border-brand-blue`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <p className="mb-4 text-sm text-gray-600">{en.category.found(total)}</p>

      {items.length === 0 ? (
        <p className="py-10 text-center text-gray-600">
          {q ? en.list.noResults(q) : en.list.noProducts}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} params={params} />
    </div>
  );
}