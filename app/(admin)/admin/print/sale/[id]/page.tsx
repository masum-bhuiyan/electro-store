import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "@/components/admin/printButton";
import PaidSeal from "@/components/admin/paidSeal";
import { customerTypeLabel } from "@/lib/customer-type";
import {
  SHOP_ADDRESS,
  SHOP_HOURS,
  SHOP_LEGAL_NAME,
  SHOP_PHONE,
  SHOP_PHONE_2,
  SHOP_WEBSITE,
} from "@/lib/site";
import { requirePermission } from "@/modules/auth/session";
import { getAdminSale } from "@/modules/sales/admin";
import { SALE_PAY_LABELS, type SalePayMethodKey } from "@/modules/sales/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "মেমো" };

type Props = {
  params: Promise<{ id: string }>;
};

function taka(n: number): string {
  return `৳${(Math.round(n * 100) / 100).toLocaleString("en-US")}`;
}

export default async function SalePrintPage({ params }: Props) {
  await requirePermission("pos.sell");

  const { id } = await params;
  if (!id || id.length > 50) notFound();

  // মেমোতে কেনা দাম/লাভ কখনো যাবে না: includeCost সবসময় false
  const s = await getAdminSale(id, false);
  if (!s) notFound();

  const when = new Date(s.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
            <style>
        {"@page { size: A4; margin: 12mm; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }"}
      </style>

      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between print:hidden">
        <Link
          href={`/admin/sales/${s.id}`}
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          ← বিক্রয়ে ফিরে যান
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-[210mm] bg-white p-8 text-sm text-black shadow print:max-w-none print:p-0 print:shadow-none">
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
            <p className="mt-1 text-base font-bold tracking-wide text-[#000000]">
              Website: {SHOP_WEBSITE}
            </p>
            <p className="text-xs text-gray-600">{SHOP_HOURS}</p>
          </div>
          <div className="w-[90px] shrink-0" />
        </header>

        <div className="mt-4 flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-xs text-gray-600">ক্রেতা</p>
            <p className="font-bold">{s.customerName ?? "Walk-in ক্রেতা"}</p>
            {s.customerPhone && <p>{s.customerPhone}</p>}
            {s.customerId && (
              <p className="text-xs text-gray-600">
                {customerTypeLabel(s.customerType)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">মেমো নং</p>
            <p className="font-mono font-bold">{s.saleNumber}</p>
            <p>{when}</p>
               {s.status === "DRAFT" && (
              <p className="text-xs font-bold text-yellow-700">
                ড্রাফট (এখনো কনফার্ম হয়নি)
              </p>
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
            {s.items.map((i, idx) => (
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
             <div>{s.due <= 0 && s.status === "CONFIRMED" && <PaidSeal />}</div>
          <div className="w-64 space-y-1">
            {s.extraDiscount > 0 && (
              <>
                <p className="flex justify-between">
                  <span>পণ্যের মোট</span>
                  <span>{taka(s.total + s.extraDiscount)}</span>
                </p>
                <p className="flex justify-between">
                  <span>অতিরিক্ত ছাড়</span>
                  <span>− {taka(s.extraDiscount)}</span>
                </p>
              </>
            )}
            <p className="flex justify-between">
              <span>সর্বমোট</span>
              <span className="font-bold">{taka(s.total)}</span>
            </p>
            <p className="flex justify-between">
              <span>
                পরিশোধ ({SALE_PAY_LABELS[s.payMethod as SalePayMethodKey] ?? s.payMethod})
              </span>
              <span>{taka(s.paid)}</span>
            </p>
            <p className="flex justify-between border-t border-black pt-1 font-bold">
              <span>বাকি</span>
              <span>{taka(s.due)}</span>
            </p>
          </div>
        </div>

        {s.note && (
          <p className="mt-4 whitespace-pre-line text-xs">নোট: {s.note}</p>
        )}

        <div className="mt-16 flex justify-between text-xs">
          <span className="border-t border-black px-6 pt-1">ক্রেতার স্বাক্ষর</span>
          <span className="border-t border-black px-6 pt-1">বিক্রেতার স্বাক্ষর</span>
        </div>
                <div className="mt-6 text-center">
          <p className="text-sm font-medium">
            আমাদের উপর আস্থা রাখার জন্য ধন্যবাদ।
          </p>
          <p className="mt-1 text-xs text-gray-700">
            কোনো সমস্যা হলে নির্দ্বিধায় ফোন বা WhatsApp করুন: {SHOP_PHONE}।
            আপনার সন্তুষ্টিই আমাদের সাফল্য।
          </p>
          <p className="mt-1 text-xs font-semibold tracking-wide text-gray-800">
            Original Tools. Honest Price.
          </p>
        </div>
      </div>
    </div>
  );
}