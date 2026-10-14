import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/productForm";
import { requireAdmin } from "@/modules/auth/session";
import { getAdminProduct, getCatalogOptions } from "@/modules/products/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  await requireAdmin();

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const [product, options] = await Promise.all([
    getAdminProduct(id),
    getCatalogOptions(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/admin/products" className="text-gray-500 hover:text-blue-600">
          ← প্রোডাক্ট তালিকা
        </Link>
      </p>
      <h1 className="mb-6 text-2xl font-bold">প্রোডাক্ট সম্পাদনা</h1>
      <ProductForm mode="edit" options={options} initial={product} />
    </div>
  );
}