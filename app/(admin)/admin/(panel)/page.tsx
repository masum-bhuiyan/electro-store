import Link from "next/link";
import { getDashboardStats } from "@/modules/admin/stats";
import { requireAdmin } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const stats = await getDashboardStats();

  const cards: { label: string; value: number; href: string | null }[] = [
    {
      label: "অপেক্ষমান অর্ডার",
      value: stats.pendingOrders,
      href: "/admin/orders?status=PENDING",
    },
    { label: "মোট অর্ডার", value: stats.totalOrders, href: "/admin/orders" },
    { label: "চালু প্রোডাক্ট", value: stats.activeProducts, href: "/admin/products" },
    { label: "কম স্টকের ভ্যারিয়ান্ট", value: stats.lowStockVariants, href: null },
  ];

  const cardClass = "rounded-lg border border-gray-200 bg-white p-5";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ড্যাশবোর্ড</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const inner = (
            <>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="mt-2 text-3xl font-bold">{c.value}</p>
            </>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className={`${cardClass} hover:border-blue-600`}>
              {inner}
            </Link>
          ) : (
            <div key={c.label} className={cardClass}>
              {inner}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/orders"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          অর্ডার ব্যবস্থাপনা
        </Link>
        <Link
          href="/admin/products"
          className="inline-block rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          প্রোডাক্ট ব্যবস্থাপনা
        </Link>
      </div>
    </div>
  );
}