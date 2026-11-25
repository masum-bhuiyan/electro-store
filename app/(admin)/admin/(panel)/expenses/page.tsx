import Link from "next/link";
import ExpenseCategoryManager from "@/components/admin/expenseCategoryManager";
import ExpenseForm from "@/components/admin/expenseForm";
import ExpenseVoidButton from "@/components/admin/expenseVoidButton";
import { requirePermission } from "@/modules/auth/session";
import {
  getAdminExpenses,
  getExpenseCategories,
  getExpenseSupplierOptions,
} from "@/modules/expenses/admin";
import { dhakaToday } from "@/modules/expenses/validation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim().slice(0, 50) || undefined;
}

function taka(n: number): string {
  return `৳${(Math.round(n * 100) / 100).toLocaleString("en-US")}`;
}

function dateText(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });
}

export default async function ExpensesPage({ searchParams }: Props) {
  await requirePermission("money.manage");

  const sp = await searchParams;
  const today = dhakaToday();
  const monthRaw = first(sp.month);
  const month =
    monthRaw && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthRaw) ? monthRaw : today.slice(0, 7);
  const catId = first(sp.cat);
  const page = Number(first(sp.page)) || 1;

  const categories = await getExpenseCategories();
  const [suppliers, list] = await Promise.all([
    getExpenseSupplierOptions(),
    getAdminExpenses({ month, categoryId: catId, page }),
  ]);

  function href(p: number): string {
    const q = new URLSearchParams({ month, page: String(p) });
    if (catId) q.set("cat", catId);
    return `/admin/expenses?${q.toString()}`;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">খরচ</h1>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">নতুন খরচ লিখুন</h2>
        <ExpenseForm
          categories={categories.filter((c) => c.isActive)}
          suppliers={suppliers}
          today={today}
        />
      </section>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">মাস</span>
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">ক্যাটাগরি</span>
          <select
            name="cat"
            defaultValue={catId ?? ""}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">সব</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          দেখুন
        </button>
      </form>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">এই মাসের মোট খরচ ({month})</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{taka(list.monthTotal)}</p>
          <p className="mt-1 text-xs text-gray-500">বাতিল খরচ ধরা হয়নি</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-2">
          <p className="mb-2 text-xs text-gray-500">ক্যাটাগরি অনুযায়ী</p>
          {list.byCategory.length === 0 ? (
            <p className="text-sm text-gray-500">এই মাসে কোনো খরচ নেই।</p>
          ) : (
            <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {list.byCategory.map((c) => (
                <li key={c.name} className="flex justify-between gap-3">
                  <span>{c.name}</span>
                  <span className="font-medium">{taka(c.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2">তারিখ</th>
              <th className="px-3 py-2">ক্যাটাগরি</th>
              <th className="px-3 py-2">বিবরণ</th>
              <th className="px-3 py-2">মাধ্যম</th>
              <th className="px-3 py-2 text-right">টাকা</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  কোনো খরচ পাওয়া যায়নি।
                </td>
              </tr>
            )}
            {list.items.map((e) => (
              <tr key={e.id} className={e.voided ? "bg-gray-50 text-gray-400" : ""}>
                <td className="px-3 py-2 whitespace-nowrap">{dateText(e.expenseDate)}</td>
                <td className="px-3 py-2">{e.categoryName}</td>
                <td className="px-3 py-2">
                  <span className="font-mono text-xs">{e.expenseNumber}</span>
                  {e.supplierName && <span className="ml-2 text-xs">· {e.supplierName}</span>}
                  {e.note && <span className="block text-xs">{e.note}</span>}
                  <span className="block text-xs">লিখেছেন: {e.staffName}</span>
                  {e.voided && (
                    <span className="block text-xs text-red-600">
                      বাতিল ({e.voidedBy}): {e.voidReason}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{e.methodLabel}</td>
                <td className={`px-3 py-2 text-right font-medium ${e.voided ? "line-through" : ""}`}>
                  {taka(e.amount)}
                </td>
                <td className="px-3 py-2 text-right">
                  {!e.voided && <ExpenseVoidButton id={e.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {list.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          {list.page > 1 ? (
            <Link href={href(list.page - 1)} className="text-blue-600 hover:underline">
              ← আগের পাতা
            </Link>
          ) : (
            <span />
          )}
          <span className="text-gray-500">
            পাতা {list.page} / {list.totalPages}
          </span>
          {list.page < list.totalPages ? (
            <Link href={href(list.page + 1)} className="text-blue-600 hover:underline">
              পরের পাতা →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}

      <details className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
        <summary className="cursor-pointer text-lg font-semibold">
          খরচের ক্যাটাগরি (নতুন যোগ বা বন্ধ করুন)
        </summary>
        <div className="mt-4">
          <ExpenseCategoryManager categories={categories} />
        </div>
      </details>
    </div>
  );
}