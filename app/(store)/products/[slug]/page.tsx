import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/store/productCard";
import ProductGallery from "@/components/store/productGallery";
import ProductPurchase from "@/components/store/productPurchase";
import Icon from "@/components/ui/icon";
import { imageUrl, isAllowedImageUrl } from "@/lib/images";
import { en } from "@/lib/messages";
import { SHOP_NAME } from "@/lib/site";
import { getProductBySlug, getRelatedProducts } from "@/modules/products/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

// ব্রাউজার ট্যাবের নাম আর Google-এ যা দেখাবে (SEO)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: en.detail.notFound };
  }

  const cover = product.images.find((src) => isAllowedImageUrl(src));
  const summary = product.description.replace(/\s+/g, " ").trim().slice(0, 160);

  return {
    title: `${product.name} | ${SHOP_NAME}`,
    description: summary,
    openGraph: cover ? { images: [{ url: imageUrl(cover, 1200) }] } : undefined,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product.categorySlug, product.id);
  const specEntries = Object.entries(product.specs);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-600">
        <Link href="/" className="hover:text-brand-blue">
          {en.category.home}
        </Link>
        {" / "}
        <Link
          href={`/category/${product.categorySlug}`}
          className="hover:text-brand-blue"
        >
          {product.categoryName}
        </Link>
        {" / "}
        <span className="font-semibold text-brand-teal">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <ProductGallery
          images={product.images}
          name={product.name}
          fallbackLetter={product.brandName[0]}
        />

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">
            {product.brandName}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold leading-snug text-brand-teal md:text-3xl">
            {product.name}
          </h1>
          {product.model && (
            <p className="mt-1 text-sm text-gray-600">
              {en.detail.model}: {product.model}
            </p>
          )}

          <div className="mt-6">
            <ProductPurchase
              productName={product.name}
              slug={product.slug}
              variants={product.variants}
            />
          </div>

          <ul className="mt-8 space-y-3 rounded-2xl bg-brand-mist p-5">
            {en.trust.slice(0, 3).map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <Icon name={item.icon} size={22} className="mt-0.5 shrink-0 text-brand-blue" />
                <span>
                  <span className="block text-sm font-bold text-brand-teal">
                    {item.title}
                  </span>
                  <span className="block text-sm text-gray-600">{item.text}</span>
                </span>
              </li>
            ))}
            {product.warrantyMonths > 0 && (
              <li className="flex items-start gap-3">
                <Icon name="shield" size={22} className="mt-0.5 shrink-0 text-brand-blue" />
                <span className="block text-sm font-bold text-brand-teal">
                  {en.detail.warranty(product.warrantyMonths)}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <section className="mt-12 max-w-3xl">
        <h2 className="font-heading text-xl font-semibold text-brand-teal md:text-2xl">
          {en.detail.description}
        </h2>
        <p className="mt-3 whitespace-pre-line break-words leading-relaxed text-gray-800">
          {product.description}
        </p>
      </section>

      {specEntries.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-brand-teal md:text-2xl">
            {en.detail.specs}
          </h2>
          <table className="mt-3 w-full max-w-xl overflow-hidden rounded-lg border border-gray-200 text-sm">
            <tbody>
              {specEntries.map(([key, value]) => (
                <tr key={key} className="border-b border-gray-200 last:border-b-0">
                  <td className="w-1/3 bg-brand-mist px-4 py-2 font-semibold capitalize text-brand-teal">
                    {key}
                  </td>
                  <td className="px-4 py-2">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 font-heading text-xl font-semibold text-brand-teal md:text-2xl">
            {en.detail.related}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}