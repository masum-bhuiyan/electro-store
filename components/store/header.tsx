/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import CartLink from "@/components/store/cartLink";
import { en } from "@/lib/messages";

export default function Header() {
  return (
    <header className="bg-brand-teal text-white">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg bg-white object-contain p-0.5"
          />
          <span className="font-heading text-lg font-semibold">{en.shopName}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm font-semibold sm:gap-4">
          <Link href="/products" className="rounded-lg px-3 py-3 hover:text-white/75">
            {en.nav.shop}
          </Link>
          <Link href="/track" className="rounded-lg px-3 py-3 hover:text-white/75">
            {en.nav.track}
          </Link>
          <CartLink />
        </nav>
      </div>
    </header>
  );
}