import ReportFilter from "@/components/admin/reportFilter";
import { formatPrice } from "@/lib/format";
import { requirePermission } from "@/modules/auth/session";
import { dhakaToday } from "@/modules/expenses/validation";
import { getMoneyOutReport } from "@/modules/reports/money-out";
import { parseRange } from "@/modules/reports/range";

export const dynamic = "force-dynamic";
export const metadata = { title: "টাকা বেরোনোর রিপোর্ট" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function MoneyOutPage({ searchParams }: Props) {
  await requirePermission("money.manage");

  const sp = await searchParams;
  const range = parseRange({
    from: first(sp.from),
    to: first(sp.to),
    month: first(sp.month),
  });
  const r = await getMoneyOutReport(range);
  const today = dhakaToday();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">টাকা বেরোনোর রিপোর্ট</h1>
      <p className="mb-5 text-sm text-gray-500">
        {r.from === r.to ? r.from : `${r.from} থেকে ${r.to}`} · ব্যবসা থেকে কত টাকা বেরিয়েছে
      </p>

      {range.error && (
        <p className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          {range.error}
        </p>
      )}

      <ReportFilter
        basePath="/admin/reports/money-out"
        from={r.from}
        to={r.to}
        type="ALL"
        showType={false}
        today={today}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">মাল কেনার বিলে দেওয়া</p>
          <p className="mt-1 text-lg font-bold">{formatPrice(r.paidAtBill)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">সাপ্লায়ারকে পরে দেওয়া</p>
          <p className="mt-1 text-lg font-bold">{formatPrice(r.laterPaid)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">খরচ</p>
          <p className="mt-1 text-lg font-bold">{formatPrice(r.expenses)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">সাপ্লায়ারের নগদ ফেরত (বাদ)</p>
          <p className="mt-1 text-lg font-bold text-green-700">
            {r.cashBack > 0 ? `− ${formatPrice(r.cashBack)}` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs text-blue-700">মোট বেরিয়েছে</p>
          <p className="mt-1 text-lg font-bold text-blue-800">
            {formatPrice(r.totalOut)}
          </p>
        </div>
      </div>

      <p className="mb-6 rounded-md bg-gray-100 p-3 text-sm text-gray-700">
        এই সময়ে মোট {formatPrice(r.boughtTotal)} টাকার মাল কেনা হয়েছে (বাকিসহ)
        {r.returnedValue > 0 ? ` আর ${formatPrice(r.returnedValue)} টাকার মাল ফেরত দেওয়া হয়েছে` : ""}।
        বাকি রাখা টাকা এখনো বেরোয়নি, তাই "মোট বেরিয়েছে"-তে ধরা হয়নি।
      </p>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">সাপ্লায়ার অনুযায়ী</h2>
        {r.bySupplier.length === 0 ? (
          <p className="text-sm text-gray-500">এই সময়ে সাপ্লায়ারের কোনো লেনদেন নেই।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="py-2 pr-3">সাপ্লায়ার</th>
                  <th className="py-2 pr-3 text-right">মাল কেনা</th>
                  <th className="py-2 pr-3 text-right">বিলে দেওয়া</th>
                  <th className="py-2 pr-3 text-right">পরে দেওয়া</th>
                  <th className="py-2 text-right">নগদ ফেরত</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {r.bySupplier.map((s) => (
                  <tr key={s.name}>
                    <td className="py-2 pr-3">{s.name}</td>
                    <td className="py-2 pr-3 text-right">{formatPrice(s.bought)}</td>
                    <td className="py-2 pr-3 text-right">{formatPrice(s.paidAtBill)}</td>
                    <td className="py-2 pr-3 text-right">{formatPrice(s.laterPaid)}</td>
                    <td className="py-2 text-right">
                      {s.cashBack > 0 ? formatPrice(s.cashBack) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {r.expensesByCategory.length > 0 && (
        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold">খরচ ক্যাটাগরি অনুযায়ী</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {r.expensesByCategory.map((c) => (
              <li key={c.name} className="flex justify-between py-2">
                <span>{c.name}</span>
                <span>{formatPrice(c.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-gray-500">
        এখানে মালিকের নিজের তোলা টাকা (withdraw) আর এক মাধ্যম থেকে অন্য মাধ্যমে
        স্থানান্তর ধরা হয়নি। স্থানান্তরের চার্জ খরচে আছে। এটা বিনিয়োগ দেখার
        রিপোর্ট, লাভ-ক্ষতির রিপোর্ট নয়।
      </p>
    </div>
  );
}