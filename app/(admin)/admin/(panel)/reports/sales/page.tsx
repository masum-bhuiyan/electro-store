import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { requirePermission } from "@/modules/auth/session";
import { addDays } from "@/modules/cash/book";
import { dhakaToday } from "@/modules/expenses/validation";
import { parseRange } from "@/modules/reports/range";
import { getSalesReport } from "@/modules/reports/sales-report";

export const dynamic = "force-dynamic";
export const metadata = { title: "বিক্রয় রিপোর্ট" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const TYPES = [
  { value: "ALL", label: "সব" },
  { value: "RETAIL", label: "খুচরা" },
  { value: "WHOLESALE", label: "পাইকারি" },
];

export default async function SalesReportPage({ searchParams }: Props) {
  await requirePermission("reports.view");

  const sp = await searchParams;
  const range = parseRange({
    from: first(sp.from),
    to: first(sp.to),
    month: first(sp.month),
    type: first(sp.type),
  });
  const report = await getSalesReport(range);

  const today = dhakaToday();
  const yesterday = addDays(today, -1);
  const monthStart = today.slice(0, 8) + "01";
  const lastMonthEnd = addDays(monthStart, -1);
  const lastMonthStart = lastMonthEnd.slice(0, 8) + "01";

  const href = (from: string, to: string, type = range.type) =>
    `/admin/reports/sales?from=${from}&to=${to}&type=${type}`;

  const quick = [
    { label: "আজ", from: today, to: today },
    { label: "গতকাল", from: yesterday, to: yesterday },
    { label: "এই মাস", from: monthStart, to: today },
    { label: "গত মাস", from: lastMonthStart, to: lastMonthEnd },
  ];

  const t = report.totals;
  const typeLabel = TYPES.find((x) => x.value === range.type)?.label ?? "সব";

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">বিক্রয় রিপোর্ট</h1>
      <p className="mb-5 text-sm text-gray-500">
        {report.from === report.to
          ? report.from
          : `${report.from} থেকে ${report.to}`}{" "}
        · ক্রেতা: {typeLabel}
      </p>

      {range.error && (
        <p className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          {range.error}
        </p>
      )}

      {/* ফিল্টার */}
      <section className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <Link
              key={q.label}
              href={href(q.from, q.to)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              {q.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {TYPES.map((x) => (
            <Link
              key={x.value}
              href={href(report.from, report.to, x.value as typeof range.type)}
              className={
                range.type === x.value
                  ? "rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              }
            >
              {x.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <form method="get" className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="type" value={range.type} />
            <label className="block text-xs text-gray-600">
              শুরু
              <input
                type="date"
                name="from"
                defaultValue={report.from}
                max={today}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs text-gray-600">
              শেষ
              <input
                type="date"
                name="to"
                defaultValue={report.to}
                max={today}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              দেখুন
            </button>
          </form>

          <form method="get" className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="type" value={range.type} />
            <label className="block text-xs text-gray-600">
              মাস বেছে নিন
              <input
                type="month"
                name="month"
                defaultValue={report.from.slice(0, 7)}
                max={today.slice(0, 7)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              মাস দেখুন
            </button>
          </form>
        </div>
      </section>
      
      <p className="mb-4">
        <a
          href={`/admin/reports/sales/export?from=${report.from}&to=${report.to}&type=${range.type}`}
          className="inline-block rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Excel/CSV ডাউনলোড
        </a>
      </p>
      {/* সারাংশ */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">দোকানের বিক্রয় ({t.posCount}টি বিল)</p>
          <p className="mt-1 text-xl font-bold">{formatPrice(t.pos)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">
            অনলাইন বিক্রয় ({t.onlineCount}টি অর্ডার)
          </p>
          <p className="mt-1 text-xl font-bold">{formatPrice(t.online)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">মাল ফেরত (বাদ)</p>
          <p className="mt-1 text-xl font-bold text-red-600">
            − {formatPrice(t.returns)}
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs text-blue-700">নিট বিক্রয়</p>
          <p className="mt-1 text-xl font-bold text-blue-800">
            {formatPrice(t.net)}
          </p>
        </div>
      </div>

      {/* দিন-ভিত্তিক টেবিল */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">দিন অনুযায়ী</h2>
        {report.rows.length === 0 ? (
          <p className="text-sm text-gray-500">এই সময়ে কোনো বিক্রয় নেই।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="py-2 pr-3">তারিখ</th>
                  <th className="py-2 pr-3 text-right">দোকান (বিল)</th>
                  <th className="py-2 pr-3 text-right">দোকান (টাকা)</th>
                  <th className="py-2 pr-3 text-right">অনলাইন (অর্ডার)</th>
                  <th className="py-2 pr-3 text-right">অনলাইন (টাকা)</th>
                  <th className="py-2 pr-3 text-right">ফেরত</th>
                  <th className="py-2 text-right">নিট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.rows.map((r) => (
                  <tr key={r.day}>
                    <td className="py-2 pr-3 font-mono">{r.day}</td>
                    <td className="py-2 pr-3 text-right">{r.posCount}</td>
                    <td className="py-2 pr-3 text-right">{formatPrice(r.pos)}</td>
                    <td className="py-2 pr-3 text-right">{r.onlineCount}</td>
                    <td className="py-2 pr-3 text-right">{formatPrice(r.online)}</td>
                    <td className="py-2 pr-3 text-right text-red-600">
                      {r.returns > 0 ? `− ${formatPrice(r.returns)}` : "—"}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatPrice(r.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-bold">
                  <td className="py-2 pr-3">মোট</td>
                  <td className="py-2 pr-3 text-right">{t.posCount}</td>
                  <td className="py-2 pr-3 text-right">{formatPrice(t.pos)}</td>
                  <td className="py-2 pr-3 text-right">{t.onlineCount}</td>
                  <td className="py-2 pr-3 text-right">{formatPrice(t.online)}</td>
                  <td className="py-2 pr-3 text-right text-red-600">
                    {t.returns > 0 ? `− ${formatPrice(t.returns)}` : "—"}
                  </td>
                  <td className="py-2 text-right">{formatPrice(t.net)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-gray-500">
          যেদিন কোনো বিক্রয় বা ফেরত নেই, সেদিন তালিকায় আসে না। অনলাইন অর্ডার গোনা
          হয় কুরিয়ারকে মাল দেওয়ার দিনে (বাতিল বাদ), ডেলিভারি চার্জ ছাড়া।
          অনলাইন অর্ডার সব খুচরা ধরা হয়।
        </p>
      </section>

      {/* টাকা আদায় (বিক্রয়ে যোগ নয়) */}
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-bold">টাকা আদায় (বিক্রয়ে যোগ হয়নি)</h2>
        <p className="mb-4 text-sm text-gray-500">
          এগুলো আগের বিক্রয়ের টাকা হাতে আসা, নতুন বিক্রয় নয়।
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md bg-gray-50 p-4">
            <p className="text-xs text-gray-500">
              ক্রেতার বাকি আদায় ({report.collections.count}বার)
            </p>
            <p className="mt-1 text-lg font-bold">
              {formatPrice(report.collections.amount)}
            </p>
          </div>
          {range.type !== "WHOLESALE" && (
            <>
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  কুরিয়ার থেকে পাওয়া ({report.courierReceived.count}টি অর্ডার)
                </p>
                <p className="mt-1 text-lg font-bold">
                  {formatPrice(report.courierReceived.amount)}
                </p>
              </div>
              <div className="rounded-md border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs text-orange-700">
                  এখন কুরিয়ারের কাছে পাওনা ({report.courierPending.count}টি অর্ডার)
                </p>
                <p className="mt-1 text-lg font-bold text-orange-800">
                  {formatPrice(report.courierPending.amount)}
                </p>
                <p className="mt-1 text-xs text-orange-700">
                  এটা আজকের অবস্থা, তারিখ ফিল্টারে বদলায় না।
                </p>
              </div>
            </>
          )}
        </div>
        {range.type !== "WHOLESALE" && report.deliveryCharge > 0 && (
          <p className="mt-4 text-xs text-gray-500">
            এই সময়ের অনলাইন অর্ডারের ক্রেতা-দেওয়া ডেলিভারি চার্জ মোট{" "}
            {formatPrice(report.deliveryCharge)}। এটা কুরিয়ারের, বিক্রয়ে ধরা হয়নি।
          </p>
        )}
      </section>
    </div>
  );
}