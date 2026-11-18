import StaffManager from "@/components/admin/staffManager";
import { requirePermission } from "@/modules/auth/session";
import { getStaffList } from "@/modules/staff/admin";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const me = await requirePermission("staff.manage");
  const staff = await getStaffList();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">কর্মচারী</h1>
      <p className="mb-2 text-sm text-gray-500">
        এখান থেকে ম্যানেজার, সেলস ও একাউন্টস কর্মচারী যোগ ও পরিচালনা করুন।
      </p>
      <p className="mb-6 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
        নোট: পেজগুলোর নিরাপত্তা-যাচাই (ধাপ ১D) শেষ না হওয়া পর্যন্ত কর্মচারীরা লগইন করতে
        পারবে না। এখন শুধু অ্যাকাউন্ট বানিয়ে রাখা যাবে।
      </p>
      <StaffManager staff={staff} currentUserId={me.id} />
    </div>
  );
}