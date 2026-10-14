import Link from "next/link";
import ProductForm from "@/components/admin/productForm";
import { requireAdmin } from "@/modules/auth/session";
import { getCatalogOptions } from "@/modules/products/admin";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  const options = await getCatalogOptions();

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/admin/products" className="text-gray-500 hover:text-blue-600">
          ← প্রোডাক্ট তালিকা
        </Link>
      </p>
      <h1 className="mb-6 text-2xl font-bold">নতুন প্রোডাক্ট</h1>
      <ProductForm mode="create" options={options} />
    </div>
  );
}