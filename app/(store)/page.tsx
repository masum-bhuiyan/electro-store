import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/store/productCard";
import { SHOP_NAME } from "@/lib/site";
import { getProducts } from "@/modules/products/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${SHOP_NAME} | স্মার্টফোন, অডিও ও অ্যাক্সেসরিজ`,
  description:
    "আসল ওয়ারেন্টিসহ স্মার্টফোন, হেডফোন ও অ্যাক্সেসরিজ। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।",
};

export default async function HomePage() {
  const featured = await getProducts({ featured: true });
  const hasFeatured = featured.items.length > 0;
  const list = hasFeatured ? featured : await getProducts({});
  const items = list.items.slice(0, 8);

  return (
    <div>
      <section className="py-10 text-center">
        <h1 className="text-3xl font-bold">{SHOP_NAME}</h1>
        <p className="mt-3 text-gray-600">
          আসল ওয়ারেন্টিসহ স্মার্টফোন, অডিও ও অ্যাক্সেসরিজ · সারা বাংলাদেশে ক্যাশ অন ডেলিভারি
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          সব প্রোডাক্ট দেখুন
        </Link>
      </section>

      <section className="mt-6">
        <h2 className="mb-4 text-xl font-bold">
          {hasFeatured ? "বিশেষ প্রোডাক্ট" : "নতুন প্রোডাক্ট"}
        </h2>

        {items.length === 0 ? (
          <p className="text-gray-500">শীঘ্রই প্রোডাক্ট যোগ হচ্ছে।</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/track" className="text-gray-500 underline hover:text-blue-600">
            অর্ডারের অবস্থা দেখুন
          </Link>
        </p>
      </section>
    </div>
  );
}