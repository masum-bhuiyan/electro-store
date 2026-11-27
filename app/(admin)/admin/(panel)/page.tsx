import Link from "next/link";
import DashboardRange from "@/components/admin/dashboardRange";
import SalesBars from "@/components/admin/salesBars";
import { formatPrice } from "@/lib/format";
import {
  getChartDays,
  getMySales,
  getPendingSummary,
  getRangeCustomers,
  getRangeExpenses,
  getStaffSales,
  resolveDashRange,
} from "@/modules/admin/dashboard";
import { getDashboardStats } from "@/modules/admin/stats";
import { requireStaff } from "@/modules/auth/session";
import { dhakaToday } from "@/modules/expenses/validation";
import { getSalesReport } from "@/modules/reports/sales-report";

export const dynamic = "force-dynamic";
export const metadata = { title: "ড্যাশবোর্ড" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

type StatProps = {
  label: string;
  value: string | number;
  note?: string;
  href: string;
  hero?: boolean;
  dot?: boolean;
  alert?: boolean;
};

function Stat({ label, value, note, href, hero }: StatProps) {
  return (
    <Link
      href={href}
      className={`block rounded-xl px-4 py-3 shadow-sm ring-1 ring-black/5 transition hover:shadow-md ${
        hero ? "bg-admin-navy text-white" : "bg-white"
      }`}
    >
      <p className={`text-sm ${hero ? "text-[#B9CCE0]" : "text-gray-500"}`}>
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-semibold">{value}</p>
      {note && (
        <p className={`text-xs ${hero ? "text-[#B9CCE0]" : "text-gray-500"}`}>
          {note}
        </p>
      )}
    </Link>
  );
}

function NowRow({ label, value, href, dot, alert }: StatProps) {
  return (
    <Link
      href={href}
      className={`flex flex-1 items-center justify-between gap-3 px-5 py-3 transition-colors ${
        alert ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`flex items-center gap-2.5 text-base ${
          alert ? "font-semibold text-red-800" : "text-gray-700"
        }`}
      >
        {alert && (
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white"
            title="কিছু পণ্যের স্টক কমে গেছে"
          >
            !
          </span>
        )}
        {label}
        {dot && (
          <span
            className="relative flex h-3 w-3"
            title="নতুন অনলাইন অর্ডার, এখনো প্রসেস হয়নি"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
          </span>
        )}
      </span>
      <span
        className={`text-2xl font-semibold ${alert ? "text-red-700" : ""}`}
      >
        {value}
      </span>
    </Link>
  );
}

export default async function AdminDashboardPage({ searchParams }: Props) {
  const staff = await requireStaff();
  const can = (p: (typeof staff.permissions)[number]) =>
    staff.permissions.includes(p);

  const sp = await searchParams;
  const range = resolveDashRange({
    range: first(sp.range),
    from: first(sp.from),
    to: first(sp.to),
  });
  const today = dhakaToday();

  const canSales = can("reports.view");
  const canOrders = can("orders.view");
  const canPos = can("pos.sell");
  const canStock = can("stock.view");

  const [stats, sales, customersN, expenses, chart, pending, mine, byStaff] =
    await Promise.all([
      getDashboardStats(),
      canSales
        ? getSalesReport({ from: range.from, to: range.to, type: "ALL" })
        : null,
      canSales ? getRangeCustomers(range.from, range.to) : null,
      can("money.manage") ? getRangeExpenses(range.from, range.to) : null,
      canSales ? getChartDays(12) : null,
      canOrders || canPos ? getPendingSummary(canOrders, canPos) : null,
      !canSales && canPos ? getMySales(staff.name, range.from, range.to) : null,
      can("ownerFinance.view") ? getStaffSales(range.from, range.to) : null,
    ]);

  const rangeCards: StatProps[] = [];
  if (sales) {
    rangeCards.push({
      label: "মোট বিক্রয়",
      value: formatPrice(sales.totals.net),
      note: `দোকান ${sales.totals.posCount}টি বিল · অনলাইন ${sales.totals.onlineCount}টি`,
      href: `/admin/reports/sales?from=${range.from}&to=${range.to}`,
      hero: true,
    });
  }
  if (mine) {
    rangeCards.push(
      {
        label: "আমার বিক্রয়",
        value: formatPrice(mine.total),
        note: `${mine.bills}টি বিল`,
        href: "/admin/sales",
        hero: true,
      },
      {
        label: "যতজনকে বিক্রি করেছি",
        value: mine.customers,
        note: "walk-in বাদে",
        href: "/admin/sales",
      }
    );
  }
  if (customersN !== null) {
    rangeCards.push({
      label: "ক্রেতার সংখ্যা",
      value: customersN,
      note: "আলাদা ক্রেতা, walk-in বাদে",
      href: "/admin/customers",
    });
  }
  if (expenses !== null) {
    rangeCards.push({
      label: "খরচ",
      value: formatPrice(expenses),
      href: "/admin/expenses",
    });
  }

  const nowRows: StatProps[] = [];
  if (pending) {
    nowRows.push({
      label: "অপেক্ষমান অর্ডার",
      value: pending.online + pending.drafts,
      href:
        pending.online > 0 || !canPos
          ? "/admin/orders?status=PENDING"
          : "/admin/sales?status=DRAFT",
      dot: pending.online > 0,
    });
  }
  if (can("products.view")) {
    nowRows.push({
      label: "মোট প্রোডাক্ট (চালু)",
      value: stats.activeProducts,
      href: "/admin/products",
    });
  }
  if (canStock) {
    nowRows.push({
      label: "কম স্টকের প্রোডাক্ট",
      value: stats.lowStockVariants,
      href: "/admin/stock?low=1",
      alert: stats.lowStockVariants > 0,
    });
  }
  if (can("customers.view")) {
    nowRows.push({
      label: "মোট ক্রেতা",
      value: stats.totalCustomers,
      href: "/admin/customers",
    });
  }

  const small =
    "rounded-md px-3 py-2 text-sm font-medium transition hover:opacity-90";
  const showRight = nowRows.length > 0 || (byStaff && byStaff.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-tight">ড্যাশবোর্ড</h1>
          <p className="text-sm text-gray-500">{range.label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardRange
            current={range.key}
            from={range.from}
            to={range.to}
            today={today}
          />
          {can("purchase.manage") && (
            <Link
              href="/admin/purchases/new"
              className={`${small} border border-gray-300 bg-white`}
            >
              + ক্রয়
            </Link>
          )}
          {can("money.manage") && (
            <Link
              href="/admin/expenses"
              className={`${small} border border-gray-300 bg-white`}
            >
              + খরচ
            </Link>
          )}
          {canPos && (
            <Link
              href="/admin/pos"
              className="rounded-lg bg-brand-orange px-7 py-3 text-lg font-bold text-brand-teal shadow-md transition hover:brightness-95 active:scale-[0.98]"
            >
              + নতুন বিক্রয়
            </Link>
          )}
        </div>
      </div>

      {range.error && (
        <p className="rounded-md bg-yellow-50 p-2 text-sm text-yellow-800">
          {range.error}
        </p>
      )}

      {rangeCards.length === 0 && nowRows.length === 0 && (
        <p className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
          আপনার জন্য এখনো কোনো অ্যাক্সেস দেওয়া হয়নি। মালিকের সাথে কথা বলুন।
        </p>
      )}

      {rangeCards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {rangeCards.map((c) => (
            <Stat key={c.label} {...c} />
          ))}
        </div>
      )}

      {(chart || showRight) && (
        <div className="grid gap-4 lg:grid-cols-3">
          {chart && (
            <section
              className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 ${
                showRight ? "lg:col-span-2" : "lg:col-span-3"
              }`}
            >
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">
                  প্রতিদিনের মোট বিক্রয়
                </h2>
                <p className="text-xs text-gray-500">
                  অনলাইন + দোকান, ফেরত বাদে · শেষ ১২ দিন
                </p>
              </div>
              <SalesBars days={chart} />
            </section>
          )}

          {showRight && (
            <div className="flex flex-col gap-4">
              {nowRows.length > 0 && (
                <section className="flex flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                  <h2 className="border-b border-gray-100 px-5 py-3 text-base font-semibold text-gray-700">
                    এখনকার অবস্থা
                  </h2>
                  <div className="flex flex-1 flex-col divide-y divide-gray-100">
                    {nowRows.map((r) => (
                      <NowRow key={r.label} {...r} />
                    ))}
                  </div>
                </section>
              )}

              {byStaff && byStaff.length > 0 && (
                <section className="rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                  <h2 className="border-b border-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700">
                    কর্মচারী অনুযায়ী বিক্রয়
                  </h2>
                  <ul className="divide-y divide-gray-100 text-sm">
                    {byStaff.slice(0, 4).map((s) => (
                      <li
                        key={s.name}
                        className="flex justify-between px-5 py-2"
                      >
                        <span>
                          {s.name}{" "}
                          <span className="text-xs text-gray-500">
                            {s.bills}টি
                          </span>
                        </span>
                        <span className="font-medium">
                          {formatPrice(s.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}