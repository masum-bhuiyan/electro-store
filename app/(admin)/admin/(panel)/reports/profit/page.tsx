import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { requirePermission } from "@/modules/auth/session";
import { addDays } from "@/modules/cash/book";
import { dhakaToday } from "@/modules/expenses/validation";
import { getProfitReport } from "@/modules/reports/profit-report";
import { parseRange } from "@/modules/reports/range";

export const dynamic = "force-dynamic";
export const metadata = { title: "লাভ-ক্ষতি রিপোর্ট" };

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

// ঋণাত্মক হলে লাল ও "−" চিহ্ন
function money(n: number): string {
  return n < 0 ? `− ${formatPrice(-n)}` : formatPrice(n);
}
function tone(n: number): string {
  return n < 0 ? "text-red-600" : "";
}

export default async function ProfitReportPage({ searchParams }: Props) {
  await requirePermission("ownerFinance.view");

  const sp = await searchParams;
  const range = parseRange({
    from: first(sp.from),
    to: first(sp.to),
    month: first(sp.month),
    type: first(sp.type),
  });
  const r = await getProfitReport(range);

  const today = dhakaToday();
  const yesterday = addDays(today, -1);
  const monthStart = today.slice(0, 8) + "01";
  const lastMonthEnd = addDays(monthStart, -1);
  const lastMonthStart = lastMonthEnd.slice(0, 8) + "01";

  const href = (from: string, to: string, type = range.type) =>
    `/admin/reports/profit?from=${from}&to=${to}&type=${type}`;

  const quick = [
    { label: "আজ", from: today, to: today },
    { label: "গতকাল", from: yesterday, to: yesterday },
    { label: "এই মাস", from: monthStart, to: today },
    { label: "গত মাস", from: lastMonthStart, to: lastMonthEnd },
  ];

  const typeLabel = TYPES.find((x) => x.value === range.type)?.label ?? "সব";
  const showExpenses = r.expensesTotal !== null;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">লাভ-ক্ষতি রিপোর্ট</h1>
      <p className="mb-5 text-sm text-gray-500">
        {r.from === r.to ? r.from : `${r.from} থেকে ${r.to}`} · ক্রেতা: {typeLabel}
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
              href={href(r.from, r.to, x.value as typeof range.type)}
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
                defaultValue={r.from}
                max={today}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs text-gray-600">
              শেষ
              <input
                type="date"
                name="to"
                defaultValue={r.to}
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
                defaultValue={r.from.slice(0, 7)}
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
          href={`/admin/reports/profit/export?from=${r.from}&to=${r.to}&type=${range.type}`}
          className="inline-block rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Excel/CSV ডাউনলোড
        </a>
      </p>
      {/* সারাংশ */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">মোট লাভ (খরচের আগে)</p>
          <p className={`mt-1 text-xl font-bold ${tone(r.grossProfit)}`}>
            {money(r.grossProfit)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">খরচ</p>
          <p className="mt-1 text-xl font-bold">
            {showExpenses ? money(r.expensesTotal!) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs text-blue-700">নিট লাভ</p>
          <p
            className={`mt-1 text-xl font-bold ${
              r.netProfit !== null && r.netProfit < 0 ? "text-red-600" : "text-blue-800"
            }`}
          >
            {showExpenses ? money(r.netProfit!) : "—"}
          </p>
        </div>
      </div>

      {!showExpenses && (
        <p className="mb-6 rounded-md bg-gray-100 p-3 text-sm text-gray-700">
          খরচ খুচরা বা পাইকারিতে ভাগ করা যায় না, তাই এই ফিল্টারে শুধু মোট লাভ
          দেখানো হচ্ছে। নিট লাভ দেখতে ক্রেতার ধরন &quot;সব&quot; বাছুন।
        </p>
      )}

      {r.uncosted.lines > 0 && (
        <p className="mb-6 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          সতর্কতা: {r.uncosted.lines}টি বিক্রয় লাইনে কেনা দাম নেই (বিক্রির দাম
          মোট {formatPrice(r.uncosted.value)}), তাই সেগুলোর লাভ হিসাবে ধরা হয়নি।
          পণ্যের কেনা দাম বসালে (ক্রয় এন্ট্রি দিলে) পরের বিক্রয় থেকে ধরা পড়বে।
        </p>
      )}

      {/* হিসাবের ভাঙা রূপ */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">হিসাব কীভাবে হলো</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>দোকানের বিক্রয়ের লাভ</span>
            <span className={tone(r.posProfit)}>{money(r.posProfit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">বাদ: বিল বন্ধ করতে দেওয়া অতিরিক্ত ছাড়</span>
            <span className="text-red-600">
              {r.extraDiscount > 0 ? `− ${formatPrice(r.extraDiscount)}` : "—"}
            </span>
          </div>
          {range.type !== "WHOLESALE" && (
            <div className="flex justify-between">
              <span>অনলাইন বিক্রয়ের লাভ (ডেলিভারি চার্জ ছাড়া)</span>
              <span className={tone(r.onlineProfit)}>{money(r.onlineProfit)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">বাদ: ফেরত মালের লাভ</span>
            <span className="text-red-600">
              {r.returnsProfit !== 0 ? `− ${money(r.returnsProfit)}` : "—"}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
            <span>মোট লাভ</span>
            <span className={tone(r.grossProfit)}>{money(r.grossProfit)}</span>
          </div>
          {showExpenses && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">বাদ: খরচ</span>
                <span className="text-red-600">
                  {r.expensesTotal! > 0 ? `− ${formatPrice(r.expensesTotal!)}` : "—"}
                </span>
              </div>
              <div className="flex justify-between border-t-2 border-gray-300 pt-2 text-base font-bold">
                <span>নিট লাভ</span>
                <span className={tone(r.netProfit!)}>{money(r.netProfit!)}</span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* দিন অনুযায়ী */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">দিন অনুযায়ী</h2>
        {r.rows.length === 0 ? (
          <p className="text-sm text-gray-500">এই সময়ে কোনো হিসাব নেই।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="py-2 pr-3">তারিখ</th>
                  <th className="py-2 pr-3 text-right">দোকানের লাভ</th>
                  <th className="py-2 pr-3 text-right">অনলাইনের লাভ</th>
                  <th className="py-2 pr-3 text-right">ফেরত (বাদ)</th>
                  <th className="py-2 pr-3 text-right">খরচ</th>
                  <th className="py-2 text-right">{showExpenses ? "নিট" : "মোট লাভ"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {r.rows.map((d) => (
                  <tr key={d.day}>
                    <td className="py-2 pr-3 font-mono">{d.day}</td>
                    <td className={`py-2 pr-3 text-right ${tone(d.pos)}`}>{money(d.pos)}</td>
                    <td className={`py-2 pr-3 text-right ${tone(d.online)}`}>{money(d.online)}</td>
                    <td className="py-2 pr-3 text-right text-red-600">
                      {d.returns !== 0 ? `− ${money(d.returns)}` : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {showExpenses && d.expenses > 0 ? formatPrice(d.expenses) : "—"}
                    </td>
                    <td className={`py-2 text-right font-medium ${tone(d.net)}`}>
                      {money(d.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-gray-500">
          দোকানের লাভ = বিক্রির দাম − কেনা দাম, অতিরিক্ত ছাড় বাদে। অনলাইন অর্ডার
          গোনা হয় কুরিয়ারকে মাল দেওয়ার দিনে। খরচ গোনা হয় খরচের তারিখে।
        </p>
      </section>

      {/* খরচের ভাগ */}
      {showExpenses && r.expensesByCategory.length > 0 && (
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
        এই রিপোর্টে মাল কেনার টাকা খরচ নয়, কারণ কেনা মাল বিক্রি হলে তার কেনা দাম
        লাভের হিসাবে বাদ যায়। কুরিয়ার-পরিবহন বা ব্যাংক চার্জ আলাদা খরচ হিসেবে ধরা
        আছে, তাই প্রতিটা পণ্যের লাভ সামান্য বেশি দেখাতে পারে, কিন্তু মাসের নিট লাভ ঠিক।
      </p>
    </div>
  );
}