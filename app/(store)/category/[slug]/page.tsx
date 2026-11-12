import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Pagination from "@/components/store/pagination";
import ProductCard from "@/components/store/productCard";
import { en } from "@/lib/messages";
import { SHOP_NAME } from "@/lib/site";
import { getCategoryBySlug } from "@/modules/catalog/queries";
import { getProducts } from "@/modules/products/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.name} | ${SHOP_NAME}`,
    description: en.category.metaDescription(category.name),
  };
}

const chip =
  "inline-flex min-h-11 items-center rounded-lg border-2 px-4 text-sm font-semibold transition-colors";

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const sp = await searchParams;
  const pageNumber = Math.floor(Number(first(sp.page))) || 1;

  const { items, total, page, totalPages } = await getProducts({
    category: category.slug,
    page: pageNumber,
  });

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600">
        <Link href="/" className="hover:text-brand-blue">
          {en.category.home}
        </Link>
        {category.parent && (
          <>
            {" / "}
            <Link
              href={`/category/${category.parent.slug}`}
              className="hover:text-brand-blue"
            >
              {category.parent.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="font-semibold text-brand-teal">{category.name}</span>
      </nav>

      <h1 className="font-heading text-2xl font-semibold text-brand-teal md:text-3xl">
        {category.name}
      </h1>
      <p className="mb-6 mt-1 text-sm text-gray-600">{en.category.found(total)}</p>

      {category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <span className={`${chip} border-brand-teal bg-brand-teal text-white`}>
            {en.category.all}
          </span>
          {category.children.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className={`${chip} border-gray-300 text-brand-teal hover:border-brand-blue`}
            >
              {c.name} ({c.productCount})
            </Link>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-gray-600">{en.category.empty}</p>
          <Link
            href="/products"
            className="mt-3 inline-block font-semibold text-brand-blue hover:underline"
          >
            {en.category.browseAll} →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        params={{}}
        basePath={`/category/${category.slug}`}
      />
    </div>
  );
}