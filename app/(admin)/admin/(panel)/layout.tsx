import Link from "next/link";
import { logoutAction } from "@/app/(admin)/admin/actions";
import { requireAdmin } from "@/modules/auth/session";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/admin" className="font-bold">
              অ্যাডমিন
            </Link>
            <Link href="/admin/orders" className="hover:text-blue-600">
              অর্ডার
            </Link>
            <Link href="/admin/products" className="hover:text-blue-600">
              প্রোডাক্ট
            </Link>
            <Link href="/" className="text-gray-500 hover:text-blue-600">
              সাইট দেখুন
            </Link>
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">{admin.name}</span>
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