import {
  SHOP_ADDRESS,
  SHOP_HOURS,
  SHOP_LEGAL_NAME,
  SHOP_PHONE,
  SHOP_PHONE_2,
  SHOP_WEBSITE,
} from "@/lib/site";
import type { SupplierLedger } from "@/modules/suppliers/ledger";

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

// ধনাত্মক = আমরা সাপ্লায়ারকে দেব, ঋণাত্মক = সাপ্লায়ার আমাদের দেবে
function balText(n: number): string {
  if (n > 0) return `${taka(n)} দিতে হবে`;
  if (n < 0) return `${taka(-n)} পাওনা`;
  return taka(0);
}

export default function SupplierLedgerView({
  data,
  printedAt,
}: {
  data: SupplierLedger;
  printedAt: string;
}) {
  return (
    <div className="text-sm text-black">
      <header className="flex items-start gap-4 border-b-2 border-black pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt={SHOP_LEGAL_NAME}
          width={90}
          height={90}
          className="-mt-1 h-[90px] w-[90px] shrink-0 object-contain"
        />
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold">{SHOP_LEGAL_NAME}</h1>
          <p className="mt-1">{SHOP_ADDRESS}</p>
          <p>
            মোবাইল: {SHOP_PHONE}, {SHOP_PHONE_2}
          </p>
          <p className="mt-1 text-base font-bold tracking-wide">Website: {SHOP_WEBSITE}</p>
          <p className="text-xs text-gray-600">{SHOP_HOURS}</p>
        </div>
        <div className="w-[90px] shrink-0" />
      </header>

      <h2 className="mt-4 text-center text-lg font-bold underline">
        সাপ্লায়ারের হিসাবের খতিয়ান
      </h2>

      <div className="mt-4 flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs text-gray-600">সাপ্লায়ার</p>
          <p className="font-bold">{data.name}</p>
          {data.phone && <p>{data.phone}</p>}
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
            <th className="py-1 text-right">দেনা বাড়ল</th>
            <th className="py-1 text-right">দেনা কমল</th>
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
            <tr key={r.key} className="border-b border-gray-300">
              <td className="py-1 whitespace-nowrap align-top">{dateText(r.date)}</td>
              <td className="py-1 align-top">
                {r.text}
                {r.detail && (
                  <span className="block text-[11px] text-gray-600">{r.detail}</span>
                )}
              </td>
              <td className="py-1 text-right align-top">
                {r.debit > 0 ? taka(r.debit) : ""}
              </td>
              <td className="py-1 text-right align-top">
                {r.credit > 0 ? taka(r.credit) : ""}
              </td>
              <td className="py-1 text-right align-top font-medium">
                {balText(r.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 text-center">
        <p className="text-sm font-medium">আমাদের উপর আস্থা রাখার জন্য ধন্যবাদ।</p>
        <p className="mt-1 text-xs font-semibold tracking-wide text-gray-800">
          Original Tools. Honest Price.
        </p>
      </div>
    </div>
  );
}