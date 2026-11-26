import Link from "next/link";
import { requirePermission } from "@/modules/auth/session";
import { addDays, getCashbook } from "@/modules/cash/book";
import { dhakaToday } from "@/modules/expenses/validation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function taka(n: number): string {
  return `৳${(Math.round(n * 100) / 100).toLocaleString("en-US")}`;
}

function dateText(date: string): string {
  return new Date(`${date}T00:00:00+06:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });
}

export default async function CashbookPage({ searchParams }: Props) {
  await requirePermission("money.manage");

  const sp = await searchParams;
  const today = dhakaToday();
  const raw = Array.isArray(sp.date) ? sp.date[0] : sp.date;

  let date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today;
  if (Number.isNaN(new Date(`${date}T00:00:00+06:00`).getTime())) date = today;
  if (date > today || date < "2020-01-01") date = today;

  const book = await getCashbook(date);
  const prev = addDays(date, -1);
  const next = addDays(date, 1);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ক্যাশবুক</h1>
        <Link href="/admin/cash" className="text-sm text-blue-600 hover:underline">
          এন্ট্রি লিখুন (ক্যাশ ও ব্যাংক) →
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Link
          href={`/admin/cashbook?date=${prev}`}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← আগের দিন
        </Link>
        <form method="get" className="flex items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">তারিখ</span>
            <input
              type="date"
              name="date"
              defaultValue={date}
              max={today}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            দেখুন
          </button>
        </form>
        {date < today ? (
          <Link
            href={`/admin/cashbook?date=${next}`}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            পরের দিন →
          </Link>
        ) : (
          <span className="px-3 py-2 text-sm text-gray-400">আজকের হিসাব</span>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-600">
        {dateText(date)} তারিখের হিসাব। দিন শেষে মোট ব্যবসার টাকা:{" "}
        <b>{taka(book.totalClosing)}</b>
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {book.cards.map((c) => (
          <div key={c.method} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold">{c.label}</p>
            {c.notStarted ? (
              <p className="mt-2 text-sm text-gray-500">
                এই তারিখে এই মাধ্যমের হিসাব শুরু হয়নি (শুরুর জমা পরে বসানো)।
              </p>
            ) : (
              <>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">দিনের শুরুতে</dt>
                    <dd>{taka(c.before)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">আজ এলো</dt>
                    <dd className="text-green-700">+ {taka(c.moneyIn)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">আজ গেল</dt>
                    <dd className="text-red-600">− {taka(c.moneyOut)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 font-bold">
                    <dt>দিনের শেষে</dt>
                    <dd className={c.closing < 0 ? "text-red-600" : ""}>{taka(c.closing)}</dd>
                  </div>
                </dl>
                {!c.openingSet && (
                  <p className="mt-2 text-xs text-orange-600">
                    শুরুর জমা বসানো হয়নি, তাই শুরু থেকে সব ধরা হয়েছে।
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2">সময়</th>
              <th className="px-3 py-2">বিবরণ</th>
              <th className="px-3 py-2">মাধ্যম</th>
              <th className="px-3 py-2 text-right">এলো</th>
              <th className="px-3 py-2 text-right">গেল</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {book.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  এই দিনে কোনো লেনদেন নেই।
                </td>
              </tr>
            )}
            {book.rows.map((r) => (
              <tr key={r.key}>
                <td className="px-3 py-2 whitespace-nowrap text-gray-500">{r.time}</td>
                <td className="px-3 py-2">
                  {r.href ? (
                    <Link href={r.href} className="text-blue-600 hover:underline">
                      {r.text}
                    </Link>
                  ) : (
                    r.text
                  )}
                  {r.assumedCash && (
                    <span className="ml-2 rounded bg-yellow-100 px-1 text-[10px] text-yellow-800">
                      নগদ ধরা
                    </span>
                  )}
                  {r.detail && <span className="block text-xs text-gray-500">{r.detail}</span>}
                  {r.staff && <span className="block text-xs text-gray-400">লিখেছেন: {r.staff}</span>}
                </td>
                <td className="px-3 py-2">{r.methodLabel}</td>
                <td className="px-3 py-2 text-right text-green-700">
                  {r.moneyIn > 0 ? taka(r.moneyIn) : ""}
                </td>
                <td className="px-3 py-2 text-right text-red-600">
                  {r.moneyOut > 0 ? taka(r.moneyOut) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        কনফার্ম বিক্রির টাকা ধরা হয়েছে, ড্রাফটের অগ্রিম নয়। অনলাইন COD-এর টাকা কুরিয়ার থেকে আসে, তাই
        এখানে নেই। &quot;নগদ ধরা&quot; সারিতে মাধ্যম সেভ করা হয় না, তাই নগদ ধরা হয়েছে।
      </p>
    </div>
  );
}