import Link from "next/link";
import CustomerForm from "@/components/admin/customerForm";
import { requirePermission } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  await requirePermission("customers.manage");

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/admin/customers" className="text-gray-500 hover:text-blue-600">
          ← ক্রেতার তালিকা
        </Link>
      </p>
      <h1 className="mb-6 text-2xl font-bold">নতুন ক্রেতা</h1>
      <CustomerForm mode="create" />
    </div>
  );
}