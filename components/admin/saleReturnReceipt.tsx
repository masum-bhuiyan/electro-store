import {
  SHOP_ADDRESS,
  SHOP_HOURS,
  SHOP_LEGAL_NAME,
  SHOP_PHONE,
  SHOP_PHONE_2,
  SHOP_WEBSITE,
} from "@/lib/site";
import type { SaleReturnReceiptData } from "@/modules/sales/return-queries";

function taka(n: number): string {
  return `৳${(Math.round(n * 100) / 100).toLocaleString("en-US")}`;
}

export default function SaleReturnReceipt({
  data,
  dateText,
}: {
  data: SaleReturnReceiptData;
  dateText: string;
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
          <p className="mt-1 text-base font-bold tracking-wide">
            Website: {SHOP_WEBSITE}
          </p>
          <p className="text-xs text-gray-600">{SHOP_HOURS}</p>
        </div>
        <div className="w-[90px] shrink-0" />
      </header>

      <h2 className="mt-4 text-center text-lg font-bold underline">মাল ফেরত রসিদ</h2>

      <div className="mt-4 flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs text-gray-600">ক্রেতা</p>
          <p className="font-bold">{data.customerName || "Walk-in ক্রেতা"}</p>
          {data.customerPhone && <p>{data.customerPhone}</p>}
          <p className="text-xs text-gray-600">{data.customerTypeText}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">ফেরত নং</p>
          <p className="font-mono font-bold">{data.returnNumber}</p>
          <p className="text-xs text-gray-600">মূল মেমো: {data.saleNumber}</p>
          <p>{dateText}</p>
        </div>
      </div>

      <table className="mt-5 w-full border-collapse text-left">
        <thead>
          <tr className="border-y border-black">
            <th className="py-1">পণ্য</th>
            <th className="py-1 text-right">পরিমাণ</th>
            <th className="py-1 text-right">দাম</th>
            <th className="py-1 text-right">মূল্য</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((i) => (
            <tr key={i.id} className="border-b border-gray-300">
              <td className="py-1">{i.name}</td>
              <td className="py-1 text-right">{i.quantity}</td>
              <td className="py-1 text-right">{taka(i.unitPrice)}</td>
              <td className="py-1 text-right">{taka(i.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-80 space-y-1">
        <p className="flex justify-between font-bold">
          <span>ফেরত মালের মূল্য</span>
          <span>{taka(data.total)}</span>
        </p>
        {data.creditAmount > 0 && (
          <p className="flex justify-between">
            <span>বাকি থেকে কাটা হলো</span>
            <span>{taka(data.creditAmount)}</span>
          </p>
        )}
        <p className="flex justify-between border-t border-black pt-1 font-bold">
          <span>নগদ ফেরত দেওয়া হলো</span>
          <span>{taka(data.cashRefund)}</span>
        </p>
      </div>

      {data.note && <p className="mt-4 whitespace-pre-line text-xs">নোট: {data.note}</p>}

      <div className="mt-16 flex justify-between text-xs">
        <span className="border-t border-black px-6 pt-1">ক্রেতার স্বাক্ষর</span>
        <span className="border-t border-black px-6 pt-1">
          গ্রহণকারী: {data.staffName}
        </span>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm font-medium">আমাদের উপর আস্থা রাখার জন্য ধন্যবাদ।</p>
        <p className="mt-1 text-xs font-semibold tracking-wide text-gray-800">
          Original Tools. Honest Price.
        </p>
      </div>
    </div>
  );
}