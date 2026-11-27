import Link from "next/link";
import PurchaseForm from "@/components/admin/purchaseForm";
import { requirePermission } from "@/modules/auth/session";
import { getSupplierOptions } from "@/modules/purchases/admin";
import { getPurchaseVariantsByIds } from "@/modules/purchases/by-ids";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewPurchasePage({ searchParams }: Props) {
  const staff = await requirePermission("purchase.manage");
  const canViewCost = staff.permissions.includes("costPrice.view");

  const sp = await searchParams;
  const addRaw = sp.add;
  const addIds = Array.isArray(addRaw) ? addRaw : addRaw ? [addRaw] : [];

  const [suppliers, initialRows] = await Promise.all([
    getSupplierOptions(),
    getPurchaseVariantsByIds(addIds, canViewCost),
  ]);

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/admin/purchases" className="text-gray-500 hover:text-blue-600">
          ← ক্রয়ের তালিকা
        </Link>
      </p>
      <h1 className="mb-4 text-2xl font-bold">নতুন ক্রয়</h1>

      {suppliers.length === 0 ? (
        <p className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
          আগে একটি সাপ্লায়ার যোগ করুন।{" "}
          <Link href="/admin/suppliers/new" className="underline">
            সাপ্লায়ার যোগ করুন
          </Link>
        </p>
      ) : (
        <PurchaseForm
          suppliers={suppliers}
          canSetPrice={staff.permissions.includes("products.edit")}
          canViewCost={canViewCost}
          initialRows={initialRows}
        />
      )}
    </div>
  );
}