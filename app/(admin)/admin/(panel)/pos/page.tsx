import PosForm from "@/components/admin/posForm";
import { requirePermission } from "@/modules/auth/session";
import { getSaleCatalog } from "@/modules/sales/search";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const staff = await requirePermission("pos.sell");
  const canViewCost = staff.permissions.includes("costPrice.view");
  const catalog = await getSaleCatalog(canViewCost);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">দোকানে বিক্রয়</h1>
      <PosForm canViewCost={canViewCost} catalog={catalog} />
    </div>
  );
}