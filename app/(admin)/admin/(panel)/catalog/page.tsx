import CatalogManager from "@/components/admin/catalogManager";
import { requireAdmin } from "@/modules/auth/session";
import { getCatalogItems } from "@/modules/catalog/admin";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  await requireAdmin();
  const { categories, brands } = await getCatalogItems();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">ক্যাটাগরি ও ব্র্যান্ড</h1>
      <p className="mb-6 text-sm text-gray-500">
        এখানে যা যোগ করবেন, প্রোডাক্টের ফর্মের ড্রপডাউনে সাথে সাথে আসবে।
      </p>
      <CatalogManager categories={categories} brands={brands} />
    </div>
  );
}