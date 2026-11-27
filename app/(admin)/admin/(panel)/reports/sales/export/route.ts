import { requirePermission } from "@/modules/auth/session";
import { csvResponse, toCsv, type Cell } from "@/modules/reports/csv";
import { parseRange } from "@/modules/reports/range";
import { getSalesReport } from "@/modules/reports/sales-report";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requirePermission("reports.view");

  const sp = new URL(request.url).searchParams;
  const range = parseRange({
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    month: sp.get("month") ?? undefined,
    type: sp.get("type") ?? undefined,
  });
  const r = await getSalesReport(range);

  const typeLabel =
    r.type === "RETAIL" ? "খুচরা" : r.type === "WHOLESALE" ? "পাইকারি" : "সব";

  const rows: Cell[][] = [
    ["বিক্রয় রিপোর্ট"],
    ["তারিখ", `${r.from} থেকে ${r.to}`],
    ["ক্রেতা", typeLabel],
    [],
    ["তারিখ", "দোকান (বিল)", "দোকান (টাকা)", "অনলাইন (অর্ডার)", "অনলাইন (টাকা)", "ফেরত", "নিট"],
    ...r.rows.map((d) => [d.day, d.posCount, d.pos, d.onlineCount, d.online, d.returns, d.net]),
    [
      "মোট",
      r.totals.posCount,
      r.totals.pos,
      r.totals.onlineCount,
      r.totals.online,
      r.totals.returns,
      r.totals.net,
    ],
    [],
    ["টাকা আদায় (বিক্রয়ে যোগ নয়)"],
    ["ক্রেতার বাকি আদায়", r.collections.count, r.collections.amount],
    ["কুরিয়ার থেকে পাওয়া", r.courierReceived.count, r.courierReceived.amount],
    ["এখন কুরিয়ারের কাছে পাওনা", r.courierPending.count, r.courierPending.amount],
    ["অনলাইনের ডেলিভারি চার্জ (বিক্রয়ে ধরা হয়নি)", "", r.deliveryCharge],
  ];

  return csvResponse(toCsv(rows), `sales-${r.from}_${r.to}.csv`);
}