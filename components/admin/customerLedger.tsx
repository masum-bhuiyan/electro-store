import ShopHeader from "@/components/admin/shopHeader";
import type { CustomerLedger } from "@/modules/customers/ledger";

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

function balText(n: number): string {
  if (n > 0) return `${taka(n)} বাকি`;
  if (n < 0) return `${taka(-n)} জমা`;
  return taka(0);
}

export default function CustomerLedgerView({
  data,
  printedAt,
}: {
  data: CustomerLedger;
  printedAt: string;
}) {
  return (
    <div className="text-sm text-black">
      <ShopHeader />

      <h2 className="mt-4 text-center text-lg font-bold underline">ক্রেতার হিসাবের খতিয়ান</h2>

      <div className="mt-4 flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs text-gray-600">ক্রেতা</p>
          <p className="font-bold">{data.name}</p>
          <p>{data.phone}</p>
          <p className="text-xs text-gray-600">{data.typeText}</p>
          {data.address && <p className="text-xs">{data.address}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">প্রিন্টের তারিখ</p>
          <p>{printedAt}</p>
          <p className="mt-2 text-xs text-gray-600">এখনকার হিসাব</p>
          <p className="text-lg font-bold">{balText(data.finalBalance)}</p>
        </div>
      </div>

      <table className="mt-5 w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-y border-black">
            <th className="py-1">তারিখ</th>
            <th className="py-1">বিবরণ</th>
            <th className="py-1 text-right">বাকি বাড়ল</th>
            <th className="py-1 text-right">জমা / কমল</th>
            <th className="py-1 text-right">হিসাব</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.length === 0 && (
            <tr>
              <td colSpan={5} className="py-3 text-center text-gray-600">
                এখনো কোনো লেনদেন নেই।
              </td>
            </tr>
          )}
          {data.rows.map((r) => (
            <tr
              key={r.key}
              className={`border-b border-gray-300 ${r.kind === "ONLINE" ? "bg-sky-50" : ""}`}
            >
              <td className="py-1 whitespace-nowrap align-top">{dateText(r.date)}</td>
              <td className="py-1 align-top">
                {r.kind === "ONLINE" && (
                  <span className="mr-1 rounded bg-sky-200 px-1 text-[10px] font-bold">
                    অনলাইন
                  </span>
                )}
                {r.text}
                {r.detail && <span className="block text-[11px] text-gray-600">{r.detail}</span>}
              </td>
              <td className="py-1 text-right align-top">
                {r.kind === "ONLINE"
                  ? r.infoAmount !== null
                    ? <span className="text-gray-500">({taka(r.infoAmount)})</span>
                    : ""
                  : r.debit > 0
                    ? taka(r.debit)
                    : ""}
              </td>
              <td className="py-1 text-right align-top">{r.credit > 0 ? taka(r.credit) : ""}</td>
              <td className="py-1 text-right align-top font-medium">
                {r.balance !== null ? balText(r.balance) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-2 text-[11px] text-gray-600">
        নীল সারি = অনলাইন অর্ডার। এর মূল্য ব্র্যাকেটে শুধু তথ্যের জন্য, বাকির হিসাবে যোগ হয় না।
      </p>

      <div className="mt-6 text-center">
        <p className="text-sm font-medium">আমাদের উপর আস্থা রাখার জন্য ধন্যবাদ।</p>
        <p className="mt-1 text-xs font-semibold tracking-wide text-gray-800">
          Original Tools. Honest Price.
        </p>
      </div>
    </div>
  );
}