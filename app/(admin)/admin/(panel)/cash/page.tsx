import Link from "next/link";
import CashEntryForm from "@/components/admin/cashEntryForm";
import CashVoidButton from "@/components/admin/cashVoidButton";
import { isCashIn } from "@/lib/cash-kind";
import { requirePermission } from "@/modules/auth/session";
import { getCashEntries, getOpeningStatuses } from "@/modules/cash/admin";
import { getCashbook } from "@/modules/cash/book";
import { dhakaToday } from "@/modules/expenses/validation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

export default async function CashPage({ searchParams }: Props) {
  await requirePermission("money.manage");

  const sp = await searchParams;
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Number(pageRaw) || 1;

    const [openings, list, book] = await Promise.all([
    getOpeningStatuses(),
    getCashEntries(page),
    getCashbook(dhakaToday()),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">ক্যাশ ও ব্যাংক</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {openings.map((o) => (
          <div key={o.method} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{o.label}: শুরুর জমা</p>
            {o.amount === null ? (
              <p className="mt-1 text-sm text-orange-600">এখনো বসানো হয়নি</p>
            ) : (
              <>
                <p className="mt-1 text-xl font-bold">{taka(o.amount)}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {o.date ? dateText(o.date) : ""} থেকে
                </p>
              </>
            )}
          </div>
        ))}
      </div>
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">এখনকার ব্যালেন্স (আজ পর্যন্ত)</p>
          <Link href="/admin/cashbook" className="text-sm text-blue-700 hover:underline">
            ক্যাশবুক দেখুন →
          </Link>
        </div>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
          {book.cards.map((c) => (
            <p key={c.method}>
              {c.label}: <b>{taka(c.closing)}</b>
            </p>
          ))}
          <p>
            মোট: <b>{taka(book.totalClosing)}</b>
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">নতুন এন্ট্রি</h2>
        <CashEntryForm today={dhakaToday()} />
      </section>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2">তারিখ</th>
              <th className="px-3 py-2">ধরন</th>
              <th className="px-3 py-2">মাধ্যম</th>
              <th className="px-3 py-2 text-right">টাকা</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  এখনো কোনো এন্ট্রি নেই।
                </td>
              </tr>
            )}
            {list.items.map((e) => {
              const transfer = e.kind === "TRANSFER";
              return (
                <tr key={e.id} className={e.voided ? "bg-gray-50 text-gray-400" : ""}>
                  <td className="px-3 py-2 whitespace-nowrap">{dateText(e.entryDate)}</td>
                  <td className="px-3 py-2">
                    {e.kindLabel}
                    <span className="block font-mono text-xs">{e.entryNumber}</span>
                    {transfer && e.charge > 0 && (
                      <span className="block text-xs">চার্জ: {taka(e.charge)} (খরচে গেছে)</span>
                    )}
                    {e.note && <span className="block text-xs">{e.note}</span>}
                    <span className="block text-xs">লিখেছেন: {e.staffName}</span>
                    {e.voided && (
                      <span className="block text-xs text-red-600">
                        বাতিল ({e.voidedBy}): {e.voidReason}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {transfer ? `${e.methodLabel} → ${e.toMethodLabel}` : e.methodLabel}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      e.voided
                        ? "line-through"
                        : transfer
                          ? "text-blue-700"
                          : isCashIn(e.kind)
                            ? "text-green-700"
                            : "text-red-600"
                    }`}
                  >
                    {transfer ? "⇄" : isCashIn(e.kind) ? "+" : "−"} {taka(e.amount)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {!e.voided && <CashVoidButton id={e.id} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {list.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          {list.page > 1 ? (
            <Link href={`/admin/cash?page=${list.page - 1}`} className="text-blue-600 hover:underline">
              ← আগের পাতা
            </Link>
          ) : (
            <span />
          )}
          <span className="text-gray-500">
            পাতা {list.page} / {list.totalPages}
          </span>
          {list.page < list.totalPages ? (
            <Link href={`/admin/cash?page=${list.page + 1}`} className="text-blue-600 hover:underline">
              পরের পাতা →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}