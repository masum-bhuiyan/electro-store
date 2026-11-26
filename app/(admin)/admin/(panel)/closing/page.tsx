import Link from "next/link";
import ClosingForm from "@/components/admin/closingForm";
import { requirePermission } from "@/modules/auth/session";
import { getCashbook } from "@/modules/cash/book";
import { getActiveClosing, getClosingHistory } from "@/modules/closing/admin";
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

export default async function ClosingPage({ searchParams }: Props) {
  await requirePermission("money.manage");

  const sp = await searchParams;
  const today = dhakaToday();
  const raw = Array.isArray(sp.date) ? sp.date[0] : sp.date;
  let date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today;
  if (Number.isNaN(new Date(`${date}T00:00:00+06:00`).getTime())) date = today;
  if (date > today || date < "2020-01-01") date = today;

  const [book, existing, history] = await Promise.all([
    getCashbook(date),
    getActiveClosing(date),
    getClosingHistory(30),
  ]);

  const cards = book.cards.map((c) => {
    const old = existing?.lines.find((l) => l.method === c.method && l.started);
    return {
      method: c.method,
      label: c.label,
      notStarted: c.notStarted,
      system: c.closing,
      counted: old ? String(old.counted) : "",
      reason: old?.reason ?? "",
    };
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">দৈনিক সমাপ্তি</h1>

      <form method="get" className="flex flex-wrap items-end gap-2">
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
        <Link
          href={`/admin/cashbook?date=${date}`}
          className="px-2 py-2 text-sm text-blue-600 hover:underline"
        >
          এই দিনের ক্যাশবুক দেখুন →
        </Link>
      </form>

      <p className="mt-3 text-sm text-gray-600">
        {dateText(date)} তারিখের সমাপ্তি।{" "}
        {existing ? (
          <span className="text-green-700">
            এই দিনের সমাপ্তি দেওয়া আছে ({existing.staffName}, মোট পার্থক্য{" "}
            {taka(existing.totalDiff)})।
          </span>
        ) : (
          <span className="text-orange-600">এই দিনের সমাপ্তি এখনো দেওয়া হয়নি।</span>
        )}
      </p>

      <div className="mt-4">
        <ClosingForm
          key={`${date}-${existing?.id ?? "new"}`}
          date={date}
          cards={cards}
          hasExisting={existing !== null}
        />
      </div>

      <h2 className="mt-8 mb-2 text-lg font-semibold">আগের সমাপ্তি</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2">তারিখ</th>
              <th className="px-3 py-2">কে দিলেন</th>
              <th className="px-3 py-2">পার্থক্য ও কারণ</th>
              <th className="px-3 py-2 text-right">মোট পার্থক্য</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                  এখনো কোনো সমাপ্তি নেই।
                </td>
              </tr>
            )}
            {history.map((h) => (
              <tr key={h.id} className={h.voided ? "bg-gray-50 text-gray-400" : ""}>
                <td className="px-3 py-2 whitespace-nowrap">
                  <Link href={`/admin/closing?date=${h.date}`} className="hover:underline">
                    {dateText(h.date)}
                  </Link>
                  <span className="block font-mono text-xs">{h.closingNumber}</span>
                  {h.voided && (
                    <span className="block text-xs text-red-600">বাতিল ({h.voidedBy})</span>
                  )}
                </td>
                <td className="px-3 py-2">{h.staffName}</td>
                <td className="px-3 py-2 text-xs">
                  {h.lines.filter((l) => l.started && l.diff !== 0).length === 0 ? (
                    <span className="text-green-700">সব মিলেছে</span>
                  ) : (
                    h.lines
                      .filter((l) => l.started && l.diff !== 0)
                      .map((l) => (
                        <span key={l.method} className="block">
                          {l.label}: {l.diff < 0 ? `${taka(-l.diff)} কম` : `${taka(l.diff)} বেশি`}
                          {l.reason ? ` (${l.reason})` : ""}
                        </span>
                      ))
                  )}
                </td>
                <td
                  className={`px-3 py-2 text-right font-medium ${
                    h.voided ? "line-through" : h.totalDiff === 0 ? "" : "text-red-600"
                  }`}
                >
                  {taka(h.totalDiff)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}