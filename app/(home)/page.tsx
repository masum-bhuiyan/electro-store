import type { Metadata } from "next";
import Link from "next/link";
import CategoryGrid from "@/components/store/categoryGrid";
import Hero from "@/components/store/hero";
import ProductCard from "@/components/store/productCard";
import { en } from "@/lib/messages";
import { SHOP_NAME } from "@/lib/site";
import { getStoreCategories } from "@/modules/catalog/queries";
import { getProducts } from "@/modules/products/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${SHOP_NAME} | Original Mobile Repair Tools in Bangladesh`,
  description:
    "Original mobile repair tools at honest prices. Authorized dealer of Sugon, ATTEN, Mechanic and more. Cash on delivery across Bangladesh.",
};

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getStoreCategories(),
    getProducts({ featured: true }),
  ]);
  const hasFeatured = featured.items.length > 0;
  const list = hasFeatured ? featured : await getProducts({});
  const items = list.items.slice(0, 8);

  return (
    <>
      <Hero />
      <CategoryGrid categories={categories} />

      <section className="bg-brand-mist">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="mb-5 flex items-baseline justify-between md:mb-7">
            <h2 className="font-heading text-2xl font-semibold text-brand-teal md:text-3xl">
              {hasFeatured ? en.home.featured : en.home.latest}
            </h2>
            <Link
              href="/products"
              className="font-semibold text-brand-blue hover:underline"
            >
              {en.home.viewAll} →
            </Link>
          </div>

          {items.length === 0 ? (
            <p className="text-gray-600">{en.home.empty}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <p className="mt-8 text-center text-sm">
            <Link
              href="/track"
              className="text-gray-600 underline hover:text-brand-blue"
            >
              {en.home.track}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}