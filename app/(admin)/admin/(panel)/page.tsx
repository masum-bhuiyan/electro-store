import Link from "next/link";
import { getDashboardStats } from "@/modules/admin/stats";
import { requireStaff } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

type Card = { label: string; value: number; href: string };

export default async function AdminDashboardPage() {
  // ড্যাশবোর্ড সব কর্মচারীর জন্য খোলা। কোন কার্ড দেখাবে তা পারমিশন ঠিক করে
  const staff = await requireStaff();
  const can = (p: (typeof staff.permissions)[number]) =>
    staff.permissions.includes(p);

  const stats = await getDashboardStats();

  const cards: Card[] = [];
  if (can("orders.view")) {
    cards.push(
      {
        label: "অপেক্ষমান অর্ডার",
        value: stats.pendingOrders,
        href: "/admin/orders?status=PENDING",
      },
      { label: "মোট অর্ডার", value: stats.totalOrders, href: "/admin/orders" }
    );
  }
  if (can("products.view")) {
    cards.push({
      label: "চালু প্রোডাক্ট",
      value: stats.activeProducts,
      href: "/admin/products",
    });
  }
  if (can("stock.view")) {
    cards.push({
      label: "কম স্টকের ভ্যারিয়ান্ট",
      value: stats.lowStockVariants,
      href: "/admin/stock?low=1",
    });
  }
    if (can("customers.view")) {
    cards.push({
      label: "মোট ক্রেতা",
      value: stats.totalCustomers,
      href: "/admin/customers",
    });
  }

  const cardClass = "rounded-lg border border-gray-200 bg-white p-5";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ড্যাশবোর্ড</h1>

      {cards.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          আপনার জন্য এখনো কোনো অ্যাক্সেস দেওয়া হয়নি। মালিকের সাথে কথা বলুন।
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className={`${cardClass} hover:border-blue-600`}
            >
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="mt-2 text-3xl font-bold">{c.value}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {can("orders.view") && (
          <Link
            href="/admin/orders"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            অর্ডার ব্যবস্থাপনা
          </Link>
        )}
        {can("products.view") && (
          <Link
            href="/admin/products"
            className="inline-block rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            প্রোডাক্ট ব্যবস্থাপনা
          </Link>
        )}
      </div>
    </div>
  );
}