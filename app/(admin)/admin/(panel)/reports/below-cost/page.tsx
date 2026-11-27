import Link from "next/link";
import ReportFilter from "@/components/admin/reportFilter";
import { formatPrice } from "@/lib/format";
import { requirePermission } from "@/modules/auth/session";
import { dhakaToday } from "@/modules/expenses/validation";
import { getBelowCostReport } from "@/modules/reports/below-cost";
import { parseRange } from "@/modules/reports/range";

export const dynamic = "force-dynamic";
export const metadata = { title: "কেনা দামের নিচে বিক্রি" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function BelowCostPage({ searchParams }: Props) {
  await requirePermission("ownerFinance.view");

  const sp = await searchParams;
  const range = parseRange({
    from: first(sp.from),
    to: first(sp.to),
    month: first(sp.month),
    type: first(sp.type),
  });
  const r = await getBelowCostReport(range);
  const today = dhakaToday();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">কেনা দামের নিচে বিক্রি</h1>
      <p className="mb-5 text-sm text-gray-500">
        {r.from === r.to ? r.from : `${r.from} থেকে ${r.to}`}
      </p>

      {range.error && (
        <p className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          {range.error}
        </p>
      )}

      <ReportFilter
        basePath="/admin/reports/below-cost"
        from={r.from}
        to={r.to}
        type={range.type}
        showType
        today={today}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">কেনা দামের নিচে বিক্রির লাইন</p>
          <p className="mt-1 text-xl font-bold">{r.totalLines}টি</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-xs text-red-700">মোট লোকসান (এই লাইনগুলোয়)</p>
          <p className="mt-1 text-xl font-bold text-red-700">
            {formatPrice(r.totalLoss)}
          </p>
        </div>
      </div>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">তালিকা (বেশি লোকসান আগে)</h2>
        {r.rows.length === 0 ? (
          <p className="text-sm text-gray-500">
            এই সময়ে কেনা দামের নিচে কিছু বিক্রি হয়নি।
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="py-2 pr-3">তারিখ</th>
                  <th className="py-2 pr-3">কোথায়</th>
                  <th className="py-2 pr-3">নম্বর</th>
                  <th className="py-2 pr-3">পণ্য</th>
                  <th className="py-2 pr-3 text-right">পরিমাণ</th>
                  <th className="py-2 pr-3 text-right">বিক্রির দাম</th>
                  <th className="py-2 pr-3 text-right">কেনা দাম</th>
                  <th className="py-2 pr-3 text-right">লোকসান</th>
                  <th className="py-2">বিক্রেতা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {r.rows.map((x) => (
                  <tr key={x.key}>
                    <td className="py-2 pr-3 font-mono">{x.day}</td>
                    <td className="py-2 pr-3">
                      {x.source === "POS" ? "দোকান" : "অনলাইন"}
                    </td>
                    <td className="py-2 pr-3">
                      <Link href={x.href} className="font-mono text-blue-600 underline">
                        {x.number}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{x.name}</td>
                    <td className="py-2 pr-3 text-right">{x.quantity}</td>
                    <td className="py-2 pr-3 text-right">{formatPrice(x.price)}</td>
                    <td className="py-2 pr-3 text-right">{formatPrice(x.cost)}</td>
                    <td className="py-2 pr-3 text-right font-medium text-red-600">
                      {formatPrice(x.loss)}
                    </td>
                    <td className="py-2">{x.staff ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {r.truncated && (
          <p className="mt-3 text-xs text-gray-500">
            সবচেয়ে বেশি লোকসানের প্রথম ৩০০টি লাইন দেখানো হয়েছে। মোট সংখ্যা ও লোকসান
            ওপরের বক্সে সব লাইন ধরেই আছে। ছোট তারিখ-সীমা দিলে বাকিগুলো দেখা যাবে।
          </p>
        )}
        <p className="mt-3 text-xs text-gray-500">
          তুলনা হয় বিক্রির সময়ে সেভ হওয়া গড় কেনা দামের সঙ্গে। বিলের অতিরিক্ত ছাড়
          এখানে ধরা হয়নি। পরে মাল ফেরত এলেও লাইনটা এখানে থাকবে। কেনা দাম নেই এমন
          লাইন তালিকায় আসে না।
        </p>
      </section>
    </div>
  );
}