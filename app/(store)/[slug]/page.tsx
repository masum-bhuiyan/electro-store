import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductPurchase from "@/components/store/productPurchase";
import { getProductBySlug } from "@/modules/products/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

// ব্রাউজার ট্যাবের নাম আর Google-এ যা দেখাবে (SEO)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "প্রোডাক্ট পাওয়া যায়নি" };
  }

  return {
    title: `${product.name} | Electro Store`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const specEntries = Object.entries(product.specs);

  return (
    <div>
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">হোম</Link>
        {" / "}
        <Link href="/products" className="hover:text-blue-600">সব প্রোডাক্ট</Link>
        {" / "}
        <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-8xl font-bold text-gray-300">
          {product.brandName[0]}
        </div>

        <div>
          <p className="text-sm text-gray-500">
            {product.brandName} · {product.categoryName}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{product.name}</h1>
          {product.model && (
            <p className="mt-1 text-sm text-gray-500">মডেল: {product.model}</p>
          )}

          <div className="mt-6">
            <ProductPurchase variants={product.variants} />
          </div>

          {product.warrantyMonths > 0 && (
            <p className="mt-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
              ✅ {product.warrantyMonths} মাসের ওয়ারেন্টি
            </p>
          )}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold">বিবরণ</h2>
        <p className="mt-3 leading-relaxed text-gray-700">{product.description}</p>
      </section>

      {specEntries.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">স্পেসিফিকেশন</h2>
          <table className="mt-3 w-full max-w-xl border border-gray-200 text-sm">
            <tbody>
              {specEntries.map(([key, value]) => (
                <tr key={key} className="border-b border-gray-200 last:border-b-0">
                  <td className="w-1/3 bg-gray-50 px-4 py-2 font-medium capitalize">
                    {key}
                  </td>
                  <td className="px-4 py-2">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}