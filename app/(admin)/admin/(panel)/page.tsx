import Link from "next/link";
import { getDashboardStats } from "@/modules/admin/stats";
import { requireAdmin } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // layout-এ পাহারা আছে, তবু পেজেও দিই (layout সবসময় নতুন করে চলে না)
  await requireAdmin();

  const stats = await getDashboardStats();

  const cards = [
    { label: "অপেক্ষমান অর্ডার", value: stats.pendingOrders },
    { label: "মোট অর্ডার", value: stats.totalOrders },
    { label: "চালু প্রোডাক্ট", value: stats.activeProducts },
    { label: "কম স্টকের ভ্যারিয়ান্ট", value: stats.lowStockVariants },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ড্যাশবোর্ড</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-gray-200 bg-white p-5"
          >
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-2 text-3xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

           <div className="mt-8">
        <Link
          href="/admin/products"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          প্রোডাক্ট ব্যবস্থাপনা
        </Link>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        অর্ডার ব্যবস্থাপনা দিন ১১-তে আসছে।
      </p>
    </div>
  );
}