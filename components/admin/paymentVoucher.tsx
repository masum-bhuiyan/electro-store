import PaidSeal from "@/components/admin/paidSeal";
import {
  SHOP_ADDRESS,
  SHOP_HOURS,
  SHOP_LEGAL_NAME,
  SHOP_PHONE,
  SHOP_PHONE_2,
  SHOP_WEBSITE,
} from "@/lib/site";
import type { SupplierVoucher } from "@/modules/payments/voucher-queries";

function taka(n: number): string {
  return `৳${(Math.round(n * 100) / 100).toLocaleString("en-US")}`;
}

// ধনাত্মক = সাপ্লায়ারের বাকি, ঋণাত্মক = সাপ্লায়ার আমাদের দেবে
function balText(n: number): string {
  if (n > 0) return `${taka(n)} (বাকি)`;
  if (n < 0) return `${taka(-n)} (সাপ্লায়ার দেবে)`;
  return taka(0);
}

export default function PaymentVoucher({
  data,
  dateText,
}: {
  data: SupplierVoucher;
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

      <h2 className="mt-4 text-center text-lg font-bold underline">
        টাকা প্রদানের ভাউচার
      </h2>

      <div className="mt-4 flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs text-gray-600">সাপ্লায়ার</p>
          <p className="font-bold">{data.supplierName}</p>
          {data.supplierPhone && <p>{data.supplierPhone}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">ভাউচার নং</p>
          <p className="font-mono font-bold">{data.paymentNumber}</p>
          <p>{dateText}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-6">
        <div>{data.balanceAfter <= 0 && <PaidSeal />}</div>
        <div className="w-80 space-y-1">
          <p className="flex justify-between">
            <span>আগের হিসাব</span>
            <span>{balText(data.balanceBefore)}</span>
          </p>
          <p className="flex justify-between">
            <span>এখন দিলেন ({data.methodLabel})</span>
            <span className="font-bold">{taka(data.amount)}</span>
          </p>
          <p className="flex justify-between border-t border-black pt-1 font-bold">
            <span>এখনকার হিসাব</span>
            <span>{balText(data.balanceAfter)}</span>
          </p>
        </div>
      </div>

      {data.note && <p className="mt-4 whitespace-pre-line text-xs">নোট: {data.note}</p>}

      <div className="mt-16 flex justify-between text-xs">
        <span className="border-t border-black px-6 pt-1">
          প্রদানকারী: {data.staffName}
        </span>
        <span className="border-t border-black px-6 pt-1">সাপ্লায়ারের স্বাক্ষর</span>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm font-medium">আমাদের সাথে ব্যবসা করার জন্য ধন্যবাদ।</p>
        <p className="mt-1 text-xs font-semibold tracking-wide text-gray-800">
          Original Tools. Honest Price.
        </p>
      </div>
    </div>
  );
}