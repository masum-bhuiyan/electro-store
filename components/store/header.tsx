import Link from "next/link";
import CartLink from "@/components/store/cartLink";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold">
          Electro Store
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/products" className="hover:text-blue-600">
            সব প্রোডাক্ট
          </Link>
          <CartLink />
        </nav>
      </div>
    </header>
  );
}