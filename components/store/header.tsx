import Link from "next/link";
import CartLink from "@/components/store/cartLink";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold">
          Electro Store
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          <Link href="/products" className="hover:text-blue-600">
            সব প্রোডাক্ট
          </Link>
          <Link href="/track" className="hover:text-blue-600">
            অর্ডার ট্র্যাক
          </Link>
          <CartLink />
        </nav>
      </div>
    </header>
  );
}