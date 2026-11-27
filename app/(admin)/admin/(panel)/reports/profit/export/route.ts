import { requirePermission } from "@/modules/auth/session";
import { csvResponse, toCsv, type Cell } from "@/modules/reports/csv";
import { getProfitReport } from "@/modules/reports/profit-report";
import { parseRange } from "@/modules/reports/range";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requirePermission("ownerFinance.view");

  const sp = new URL(request.url).searchParams;
  const range = parseRange({
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    month: sp.get("month") ?? undefined,
    type: sp.get("type") ?? undefined,
  });
  const r = await getProfitReport(range);

  const typeLabel =
    r.type === "RETAIL" ? "খুচরা" : r.type === "WHOLESALE" ? "পাইকারি" : "সব";
  const hasExp = r.expensesTotal !== null;

  const rows: Cell[][] = [
    ["লাভ-ক্ষতি রিপোর্ট"],
    ["তারিখ", `${r.from} থেকে ${r.to}`],
    ["ক্রেতা", typeLabel],
    [],
    ["হিসাব"],
    ["দোকানের বিক্রয়ের লাভ", r.posProfit],
    ["বাদ: অতিরিক্ত ছাড়", r.extraDiscount],
    ["অনলাইন বিক্রয়ের লাভ", r.onlineProfit],
    ["বাদ: ফেরত মালের লাভ", r.returnsProfit],
    ["মোট লাভ", r.grossProfit],
    ["বাদ: খরচ", r.expensesTotal],
    ["নিট লাভ", r.netProfit],
    [],
    ["তারিখ", "দোকানের লাভ", "অনলাইনের লাভ", "ফেরত (বাদ)", "খরচ", hasExp ? "নিট" : "মোট লাভ"],
    ...r.rows.map((d) => [d.day, d.pos, d.online, d.returns, hasExp ? d.expenses : null, d.net]),
  ];

  if (hasExp && r.expensesByCategory.length > 0) {
    rows.push([], ["খরচ ক্যাটাগরি অনুযায়ী"]);
    for (const c of r.expensesByCategory) rows.push([c.name, c.amount]);
  }
  if (r.uncosted.lines > 0) {
    rows.push(
      [],
      ["সতর্কতা: কেনা দাম নেই এমন লাইন (লাভে ধরা হয়নি)", r.uncosted.lines, r.uncosted.value]
    );
  }

  return csvResponse(toCsv(rows), `profit-${r.from}_${r.to}.csv`);
}