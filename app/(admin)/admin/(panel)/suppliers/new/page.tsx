import Link from "next/link";
import SupplierForm from "@/components/admin/supplierForm";
import { requirePermission } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function NewSupplierPage() {
  await requirePermission("purchase.manage");

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/admin/suppliers" className="text-gray-500 hover:text-blue-600">
          ← সাপ্লায়ারের তালিকা
        </Link>
      </p>
      <h1 className="mb-6 text-2xl font-bold">নতুন সাপ্লায়ার</h1>
      <SupplierForm mode="create" />
    </div>
  );
}