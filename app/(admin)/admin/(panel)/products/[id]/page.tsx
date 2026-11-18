import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/productForm";
import { requirePermission } from "@/modules/auth/session";
import { getAdminProduct, getCatalogOptions } from "@/modules/products/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const staff = await requirePermission("products.edit");
  const canViewCost = staff.permissions.includes("costPrice.view");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const [found, options] = await Promise.all([
    getAdminProduct(id),
    getCatalogOptions(),
  ]);
  if (!found) notFound();

  // কেনা দাম দেখার অনুমতি না থাকলে ব্রাউজারে পাঠানোর আগেই মুছে দিই
  const product = canViewCost
    ? found
    : {
        ...found,
        variants: found.variants.map((v) => ({ ...v, costPrice: null })),
      };

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/admin/products" className="text-gray-500 hover:text-blue-600">
          ← প্রোডাক্ট তালিকা
        </Link>
      </p>
      <h1 className="mb-6 text-2xl font-bold">প্রোডাক্ট সম্পাদনা</h1>
      <ProductForm
        mode="edit"
        options={options}
        initial={product}
        canViewCost={canViewCost}
      />
    </div>
  );
}