import PaidSeal from "@/components/admin/paidSeal";
import ShopHeader from "@/components/admin/shopHeader";
import { SHOP_PHONE } from "@/lib/site";

export type MemoData = {
  // কনফার্মের আগে null
  saleNumber: string | null;
  dateText: string;
  customerName: string | null;
  customerPhone: string | null;
  customerTypeText: string | null;
  items: { name: string; quantity: number; unitPrice: number }[];
  itemsTotal: number;
  extraDiscount: number;
  total: number;
  paid: number;
  due: number;
  payMethodLabel: string;
  note: string | null;
    // সংশোধন করা বিক্রয় হলে true
  revised?: boolean;
};

function taka(n: number): string {
  return `৳${(Math.round(n * 100) / 100).toLocaleString("en-US")}`;
}

export default function SaleMemo({ data }: { data: MemoData }) {
  return (
    <div className="text-sm text-black">
            <ShopHeader />

      <div className="mt-4 flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs text-gray-600">ক্রেতা</p>
          <p className="font-bold">{data.customerName ?? "Walk-in ক্রেতা"}</p>
          {data.customerPhone && <p>{data.customerPhone}</p>}
          {data.customerTypeText && (
            <p className="text-xs text-gray-600">{data.customerTypeText}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">মেমো নং</p>
          <p className="font-mono font-bold">{data.saleNumber ?? "কনফার্মের পর"}</p>
          <p>{data.dateText}</p>
                    {data.revised && (
            <p className="text-xs font-bold text-gray-700">সংশোধিত</p>
          )}
        </div>
      </div>

      <table className="mt-4 w-full border-collapse text-left">
        <thead>
          <tr className="border-y border-black">
            <th className="py-2 pr-2">#</th>
            <th className="py-2">পণ্য</th>
            <th className="py-2 text-right">পরিমাণ</th>
            <th className="py-2 text-right">দাম</th>
            <th className="py-2 text-right">মোট</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((i, idx) => (
            <tr key={idx} className="border-b border-gray-300">
              <td className="py-2 pr-2">{idx + 1}</td>
              <td className="py-2">{i.name}</td>
              <td className="py-2 text-right">{i.quantity}</td>
              <td className="py-2 text-right">{taka(i.unitPrice)}</td>
              <td className="py-2 text-right">{taka(i.quantity * i.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex items-center justify-between gap-6">
        <div>{data.due <= 0 && <PaidSeal />}</div>
        <div className="w-64 space-y-1">
          {data.extraDiscount > 0 && (
            <>
              <p className="flex justify-between">
                <span>পণ্যের মোট</span>
                <span>{taka(data.itemsTotal)}</span>
              </p>
              <p className="flex justify-between">
                <span>অতিরিক্ত ছাড়</span>
                <span>− {taka(data.extraDiscount)}</span>
              </p>
            </>
          )}
          <p className="flex justify-between">
            <span>সর্বমোট</span>
            <span className="font-bold">{taka(data.total)}</span>
          </p>
          <p className="flex justify-between">
            <span>পরিশোধ ({data.payMethodLabel})</span>
            <span>{taka(data.paid)}</span>
          </p>
          <p className="flex justify-between border-t border-black pt-1 font-bold">
            <span>বাকি</span>
            <span>{taka(data.due)}</span>
          </p>
        </div>
      </div>

      {data.note && (
        <p className="mt-4 whitespace-pre-line text-xs">নোট: {data.note}</p>
      )}

      <div className="mt-16 flex justify-between text-xs">
        <span className="border-t border-black px-6 pt-1">ক্রেতার স্বাক্ষর</span>
        <span className="border-t border-black px-6 pt-1">বিক্রেতার স্বাক্ষর</span>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm font-medium">আমাদের উপর আস্থা রাখার জন্য ধন্যবাদ।</p>
        <p className="mt-1 text-xs text-gray-700">
          কোনো সমস্যা হলে নির্দ্বিধায় ফোন বা WhatsApp করুন: {SHOP_PHONE}।
          আপনার সন্তুষ্টিই আমাদের সাফল্য।
        </p>
        <p className="mt-1 text-xs font-semibold tracking-wide text-gray-800">
          Original Tools. Honest Price.
        </p>
      </div>
    </div>
  );
}