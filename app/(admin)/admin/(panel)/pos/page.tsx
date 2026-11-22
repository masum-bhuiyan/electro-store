import Link from "next/link";
import PosForm, { type PosDraftInit } from "@/components/admin/posForm";
import { requirePermission } from "@/modules/auth/session";
import { getDraftForEdit } from "@/modules/sales/admin";
import { getSaleCatalog } from "@/modules/sales/search";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PosPage({ searchParams }: Props) {
  const staff = await requirePermission("pos.sell");
  const canViewCost = staff.permissions.includes("costPrice.view");

  const sp = await searchParams;
  const draftRaw = Array.isArray(sp.draft) ? sp.draft[0] : sp.draft;
  const draftId = draftRaw?.trim().slice(0, 50) || undefined;

  let catalog = await getSaleCatalog(canViewCost);
  let draft: PosDraftInit | undefined;

  if (draftId) {
    const d = await getDraftForEdit(draftId);
    if (!d) {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-bold">ড্রাফট এডিট</h1>
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            ড্রাফট পাওয়া যায়নি। এটা হয়তো কনফার্ম বা ডিলিট হয়ে গেছে।
          </p>
          <p className="mt-3 text-sm">
            <Link href="/admin/sales?status=DRAFT" className="text-blue-600 hover:underline">
              ← ড্রাফটের তালিকা
            </Link>
          </p>
        </div>
      );
    }

    // এই ড্রাফটে আটকে থাকা স্টক এডিটের সময় "পাওয়া যায়" ধরা হবে
    const reserved = new Map<string, number>();
    for (const it of d.items) {
      reserved.set(it.variantId, (reserved.get(it.variantId) ?? 0) + it.quantity);
    }
    catalog = catalog.map((c) =>
      reserved.has(c.id) ? { ...c, stock: c.stock + (reserved.get(c.id) ?? 0) } : c
    );

    const lines: PosDraftInit["lines"] = [];
    let missing = false;
    for (const it of d.items) {
      const row = catalog.find((c) => c.id === it.variantId);
      if (!row) {
        missing = true;
        break;
      }
      lines.push({
        ...row,
        quantity: String(it.quantity),
        unitPrice: String(it.unitPrice),
      });
    }

    if (missing) {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-bold">ড্রাফট এডিট</h1>
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            এই ড্রাফটের কোনো পণ্য এখন বন্ধ আছে, তাই এডিট করা যাচ্ছে না। পণ্যটা চালু করুন
            অথবা ড্রাফট ডিলিট করুন।
          </p>
          <p className="mt-3 text-sm">
            <Link href={`/admin/sales/${d.id}`} className="text-blue-600 hover:underline">
              ← ড্রাফটে ফিরে যান
            </Link>
          </p>
        </div>
      );
    }

    draft = {
      id: d.id,
      saleNumber: d.saleNumber,
      customer: d.customer,
      looseName: d.looseName,
      customerType: d.customerType,
      lines,
      paid: d.paid,
      extraDiscount: d.extraDiscount,
      payMethod: d.payMethod,
      note: d.note,
    };
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">
        {draft ? "ড্রাফট এডিট" : "দোকানে বিক্রয়"}
      </h1>
      <PosForm
        key={draft?.id ?? "new"}
        canViewCost={canViewCost}
        catalog={catalog}
        draft={draft}
      />
    </div>
  );
}