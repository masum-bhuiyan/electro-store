import PaidSeal from "@/components/admin/paidSeal";
import { paymentMethodLabel } from "@/lib/order-status";
import ShopHeader from "@/components/admin/shopHeader";
import { SHOP_PHONE } from "@/lib/site";
import type { AdminOrderDetail } from "@/modules/orders/admin";

function taka(n: number): string {
  return `৳${(Math.round(n * 100) / 100).toLocaleString("en-US")}`;
}

export default function OrderMemo({
  order,
  dateText,
}: {
  order: AdminOrderDetail;
  dateText: string;
}) {
  const cancelled = order.status === "CANCELLED";
  const paid = order.paymentStatus === "PAID";
  const codDue = !paid && !cancelled;

  return (
    <div className="text-sm text-black">
       <ShopHeader />

      <h2 className="mt-4 text-center text-lg font-bold underline">
        অনলাইন অর্ডার মেমো
      </h2>

      <div className="mt-4 flex flex-wrap justify-between gap-4">
        <div className="max-w-[60%]">
          <p className="text-xs text-gray-600">ক্রেতা</p>
          <p className="font-bold">{order.customerName}</p>
          <p>{order.phone}</p>
          <p className="mt-1 text-xs">{order.address}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">অর্ডার নং</p>
          <p className="font-mono font-bold">{order.orderNumber}</p>
          <p>{dateText}</p>
          {cancelled && <p className="text-xs font-bold">বাতিল অর্ডার</p>}
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
          {order.items.map((i, idx) => (
            <tr key={i.id} className="border-b border-gray-300">
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
        <div>{paid && !cancelled && <PaidSeal />}</div>
        <div className="w-72 space-y-1">
          <p className="flex justify-between">
            <span>পণ্যের মোট</span>
            <span>{taka(order.subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span>ডেলিভারি চার্জ</span>
            <span>{taka(order.shippingFee)}</span>
          </p>
          <p className="flex justify-between border-t border-black pt-1 font-bold">
            <span>সর্বমোট</span>
            <span>{taka(order.total)}</span>
          </p>
          <p className="flex justify-between text-xs text-gray-700">
            <span>পেমেন্ট</span>
            <span>{paymentMethodLabel(order.paymentMethod)}</span>
          </p>
          {codDue && (
            <p className="flex justify-between font-bold">
              <span>ডেলিভারির সময় দিতে হবে</span>
              <span>{taka(order.total)}</span>
            </p>
          )}
        </div>
      </div>

      {order.notes && (
        <p className="mt-4 whitespace-pre-line text-xs">নোট: {order.notes}</p>
      )}

      <div className="mt-10 text-center">
        <p className="text-sm font-medium">আমাদের উপর আস্থা রাখার জন্য ধন্যবাদ।</p>
        <p className="mt-1 text-xs text-gray-700">
          পণ্য হাতে পেয়ে কোনো সমস্যা হলে নির্দ্বিধায় ফোন বা WhatsApp করুন: {SHOP_PHONE}।
          আপনার সন্তুষ্টিই আমাদের সাফল্য।
        </p>
        <p className="mt-1 text-xs font-semibold tracking-wide text-gray-800">
          Original Tools. Honest Price.
        </p>
      </div>
    </div>
  );
}