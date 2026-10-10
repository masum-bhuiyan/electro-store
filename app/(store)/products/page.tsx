import Pagination from "@/components/store/pagination";
import ProductCard from "@/components/store/productCard";
import ProductFilters from "@/components/store/productFilters";
import { getProducts } from "@/modules/products/queries";

// আপাতত প্রতিবার ডাটাবেস থেকে নতুন ডাটা আনবে। ক্যাশিং দিন ১৩-তে করব।
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// URL-এ একই নাম দুইবার থাকলে (?q=a&q=b) প্রথমটা নিই
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const q = first(sp.q)?.trim() || undefined;
  const pageNumber = Math.floor(Number(first(sp.page))) || 1;

  const { items, total, page, totalPages } = await getProducts({
    q,
    page: pageNumber,
  });

  // পেজ নম্বরের লিংকে সার্চ ধরে রাখার জন্য
  const params: Record<string, string> = {};
  if (q) params.q = q;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">সব প্রোডাক্ট</h1>

      <ProductFilters q={q} />

      <p className="mb-4 text-sm text-gray-500">{total}টি প্রোডাক্ট পাওয়া গেছে</p>

      {items.length === 0 ? (
        <p className="py-10 text-center text-gray-500">
          {q
            ? "এই নামে কোনো প্রোডাক্ট মেলেনি। অন্য কিছু দিয়ে চেষ্টা করুন।"
            : "এখনো কোনো প্রোডাক্ট নেই।"}
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