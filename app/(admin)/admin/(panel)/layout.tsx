import Link from "next/link";
import { logoutAction } from "@/app/(admin)/admin/actions";
import { ROLE_LABELS } from "@/lib/permissions";
import { requireStaff } from "@/modules/auth/session";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  const can = (p: (typeof staff.permissions)[number]) =>
    staff.permissions.includes(p);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium">
            <Link href="/admin" className="font-bold">
              অ্যাডমিন
            </Link>
                        {can("pos.sell") && (
              <Link href="/admin/pos" className="hover:text-blue-600">
                বিক্রয়
              </Link>
            )}
                        {can("pos.sell") && (
              <Link href="/admin/sales" className="hover:text-blue-600">
                বিক্রয়ের তালিকা
              </Link>
            )}
            {can("orders.view") && (
              <Link href="/admin/orders" className="hover:text-blue-600">
                অর্ডার
              </Link>
            )}
            {can("products.view") && (
              <Link href="/admin/products" className="hover:text-blue-600">
                প্রোডাক্ট
              </Link>
            )}
            {can("stock.view") && (
              <Link href="/admin/stock" className="hover:text-blue-600">
                স্টক
              </Link>
            )}
            {can("catalog.manage") && (
              <Link href="/admin/catalog" className="hover:text-blue-600">
                ক্যাটাগরি ও ব্র্যান্ড
              </Link>
            )}
                        {can("customers.view") && (
              <Link href="/admin/customers" className="hover:text-blue-600">
                ক্রেতা
              </Link>
            )}
                        {can("purchase.manage") && (
              <Link href="/admin/purchases" className="hover:text-blue-600">
                ক্রয়
              </Link>
            )}
                        {can("purchase.manage") && (
              <Link href="/admin/suppliers" className="hover:text-blue-600">
                সাপ্লায়ার
              </Link>
            )}
            {can("staff.manage") && (
              <Link href="/admin/staff" className="hover:text-blue-600">
                কর্মচারী
              </Link>
            )}
            <Link href="/" className="text-gray-500 hover:text-blue-600">
              সাইট দেখুন
            </Link>
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">
              {staff.name} ({ROLE_LABELS[staff.role]})
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
              >
                লগআউট
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}