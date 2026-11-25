import Link from "next/link";
import PosForm, { type PosDraftInit } from "@/components/admin/posForm";
import { requirePermission } from "@/modules/auth/session";
import { getDraftForEdit, getSaleCustomerById } from "@/modules/sales/admin";
import { getSaleCatalog } from "@/modules/sales/search";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim().slice(0, 50) || undefined;
}

function Message({ title, text, backHref, backText }: {
  title: string;
  text: string;
  backHref: string;
  backText: string;
}) {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{text}</p>
      <p className="mt-3 text-sm">
        <Link href={backHref} className="text-blue-600 hover:underline">
          {backText}
        </Link>
      </p>
    </div>
  );
}

export default async function PosPage({ searchParams }: Props) {
  const staff = await requirePermission("pos.sell");
  const canViewCost = staff.permissions.includes("costPrice.view");

  const sp = await searchParams;
  const editId = first(sp.edit);
  const draftId = first(sp.draft);
  const targetId = editId ?? draftId;
  const kind: "draft" | "sale" = editId ? "sale" : "draft";
  const title = kind === "sale" ? "বিক্রয় সংশোধন" : "ড্রাফট এডিট";
    // বদলে নতুন মাল দেওয়ার সময়: ?customer=<id>। শুধু নতুন বিক্রয়ে কাজ করে
  const customerParam = first(sp.customer);
  const initialCustomer =
    !targetId && customerParam ? await getSaleCustomerById(customerParam) : null;

  if (editId && !staff.permissions.includes("sales.edit")) {
    return (
      <Message
        title={title}
        text="বিক্রয় সংশোধন করার অনুমতি আপনার নেই।"
        backHref={`/admin/sales/${editId}`}
        backText="← বিক্রয়ে ফিরে যান"
      />
    );
  }

  let catalog = await getSaleCatalog(canViewCost);
  let draft: PosDraftInit | undefined;

  if (targetId) {
    const d = await getDraftForEdit(targetId, kind === "sale" ? "CONFIRMED" : "DRAFT");
    if (!d) {
      return (
        <Message
          title={title}
          text={
            kind === "sale"
              ? "বিক্রয় পাওয়া যায়নি, অথবা এটা কনফার্ম হওয়া বিক্রয় নয়।"
              : "ড্রাফট পাওয়া যায়নি। এটা হয়তো কনফার্ম বা ডিলিট হয়ে গেছে।"
          }
          backHref="/admin/sales"
          backText="← বিক্রয়ের তালিকা"
        />
      );
    }

    // এই বিক্রয়ে আগেই কাটা স্টক এডিটের সময় "পাওয়া যায়" ধরা হবে
    const reserved = new Map<string, number>();
    for (const it of d.items) {
      reserved.set(it.variantId, (reserved.get(it.variantId) ?? 0) + it.quantity);
    }
    catalog = catalog.map((c) =>
      reserved.has(c.id) ? { ...c, stock: c.stock + (reserved.get(c.id) ?? 0) } : c
    );

    const lines: PosDraftInit["lines"] = [];
    for (const it of d.items) {
      const row = catalog.find((c) => c.id === it.variantId);
      if (!row) {
        return (
          <Message
            title={title}
            text="এর কোনো পণ্য এখন বন্ধ আছে, তাই এডিট করা যাচ্ছে না। পণ্যটা চালু করুন।"
            backHref={`/admin/sales/${d.id}`}
            backText="← ফিরে যান"
          />
        );
      }
      lines.push({
        ...row,
        quantity: String(it.quantity),
        unitPrice: String(it.unitPrice),
      });
    }

    draft = {
      id: d.id,
      kind,
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
      <h1 className="mb-4 text-2xl font-bold">{draft ? title : "দোকানে বিক্রয়"}</h1>
      {initialCustomer && (
        <p className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          বদলে নতুন মাল দিচ্ছেন। ক্রেতা বসানো আছে: <b>{initialCustomer.name}</b>। পণ্য
          যোগ করে বিল করুন। (ফেরতের টাকা আগের ফেরত রসিদ অনুযায়ী মিটে গেছে।)
        </p>
      )}
      <PosForm
        key={draft ? `${draft.kind}-${draft.id}` : `new-${initialCustomer?.id ?? ""}`}
        canViewCost={canViewCost}
        catalog={catalog}
        draft={draft}
        initialCustomer={initialCustomer}
      />
    </div>
  );
}