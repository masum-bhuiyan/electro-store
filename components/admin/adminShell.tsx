"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export type NavItem = { label: string; href: string };
export type NavGroup = { title: string; items: NavItem[] };

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname: string, g: NavGroup): boolean {
  return g.items.some((it) => isActive(pathname, it.href));
}

const linkBase =
  "block rounded-md px-3 py-2.5 text-base transition-colors duration-200";
const linkOn = `${linkBase} bg-brand-blue font-medium text-white`;
const linkOff = `${linkBase} text-[#C9D8E8] hover:bg-white/10 hover:text-white`;

export default function AdminShell({
  groups,
  userLabel,
  logoutSlot,
  children,
}: {
  groups: NavGroup[];
  userLabel: string;
  logoutSlot: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const g of groups) if (groupHasActive(pathname, g)) m[g.title] = true;
    return m;
  });

  useEffect(() => {
    setDrawer(false);
    setOpenMap((prev) => {
      const next = { ...prev };
      for (const g of groups) {
        if (groupHasActive(pathname, g)) next[g.title] = true;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggle(title: string) {
    setOpenMap((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
      {groups.map((g) => {
        if (g.items.length === 1) {
          const it = g.items[0];
          return (
            <Link
              key={g.title || it.href}
              href={it.href}
              className={isActive(pathname, it.href) ? linkOn : linkOff}
            >
              {g.title || it.label}
            </Link>
          );
        }

        const open = !!openMap[g.title];
        const hasActive = groupHasActive(pathname, g);
        return (
          <div key={g.title}>
            <button
              type="button"
              onClick={() => toggle(g.title)}
              aria-expanded={open}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-base transition-colors duration-200 ${
                hasActive && !open
                  ? "bg-white/10 text-white"
                  : "text-[#C9D8E8] hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{g.title}</span>
              <span
                aria-hidden="true"
                className={`text-sm transition-transform duration-300 ease-in-out ${
                  open ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                open
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden" inert={!open}>
                <ul className="mt-0.5 ml-3 space-y-0.5 border-l border-white/15 pl-2">
                  {g.items.map((it) => (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={
                          isActive(pathname, it.href) ? linkOn : linkOff
                        }
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="px-5 py-6">
      <p className="font-heading text-xl font-semibold text-white">
        Bhuiyan Tools
      </p>
      <p className="text-xs text-[#8FB0D0]">অ্যাডমিন প্যানেল</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-admin-bg lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-admin-navy lg:sticky lg:top-0 lg:flex lg:h-screen">
        {brand}
        {nav}
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="মেনু বন্ধ করুন"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="relative flex h-full w-72 flex-col bg-admin-navy">
            {brand}
            {nav}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="মেনু খুলুন"
              onClick={() => setDrawer(true)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-lg lg:hidden"
            >
              ☰
            </button>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-brand-blue"
            >
              সাইট দেখুন ↗
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-gray-600 sm:inline">{userLabel}</span>
            {logoutSlot}
          </div>
        </header>

        <main className="admin-main mx-auto max-w-6xl px-4 py-5 lg:px-8 lg:py-5">
          {children}
        </main>
      </div>
    </div>
  );
}