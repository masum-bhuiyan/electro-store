import Link from "next/link";
import { notFound } from "next/navigation";
import SupplierForm from "@/components/admin/supplierForm";
import { requirePermission } from "@/modules/auth/session";
import { getAdminSupplier } from "@/modules/suppliers/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditSupplierPage({ params }: Props) {
  await requirePermission("purchase.manage");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  const supplier = await getAdminSupplier(id);
  if (!supplier) notFound();

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/admin/suppliers" className="text-gray-500 hover:text-blue-600">
          ← সাপ্লায়ারের তালিকা
        </Link>
      </p>
      <h1 className="mb-1 text-2xl font-bold">{supplier.name}</h1>
      {!supplier.isActive && (
        <p className="mb-4 text-sm text-gray-500">এই সাপ্লায়ার বন্ধ আছে।</p>
      )}
      <div className="mt-4">
        <SupplierForm
          mode="edit"
          initial={{
            id: supplier.id,
            name: supplier.name,
            contactName: supplier.contactName,
            phone: supplier.phone,
            address: supplier.address,
            note: supplier.note,
          }}
        />
      </div>
      <p className="mt-4 text-xs text-gray-500">
        কেনাকাটার ইতিহাস ও বাকির হিসাব ERP-4 ও ERP-5 শেষ হলে এখানে আসবে।
      </p>
    </div>
  );
}