import Link from "next/link";
import Icon from "@/components/ui/icon";
import { en } from "@/lib/messages";
import type { StoreCategory } from "@/modules/catalog/queries";

export default function CategoryGrid({
  categories,
}: {
  categories: StoreCategory[];
}) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <h2 className="mb-5 font-heading text-2xl font-semibold text-brand-teal md:mb-7 md:text-3xl">
        {en.category.shopBy}
      </h2>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/category/${c.slug}`}
              className="flex h-full min-h-28 flex-col gap-3 rounded-2xl bg-brand-mist p-4 transition hover:shadow-md md:p-6"
            >
              <Icon name="tool" size={28} className="text-brand-blue" />
              <span className="mt-auto">
                <span className="block text-sm font-bold text-brand-teal md:text-base">
                  {c.name}
                </span>
                <span className="mt-0.5 block text-xs text-gray-600 md:text-sm">
                  {en.category.products(c.productCount)}
                </span>
              </span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/products"
            className="flex h-full min-h-28 items-end rounded-2xl bg-brand-teal p-4 text-sm font-bold text-white transition hover:brightness-110 md:p-6 md:text-base"
          >
            {en.category.allProducts} →
          </Link>
        </li>
      </ul>
    </section>
  );
}