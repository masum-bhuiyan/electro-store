import { isZone, type Zone } from "@/lib/shipping";

export type OrderEditInput = {
  orderId: string;
  items: { id: string; unitPrice: string }[];
  // null = এলাকা বদলাতে চায় না
  zone: Zone | null;
  shippingFee: string;
  reason: string | null;
};

export type ValidatedEdit =
  | { ok: true; data: OrderEditInput }
  | { ok: false; errors: Record<string, string> };

const MONEY = /^\d{1,8}(\.\d{1,2})?$/;
const MAX_ITEM_PRICE = 10_000_000; // ভুল টাইপ (বাড়তি শূন্য) ঠেকাতে সাধারণ সীমা
const MAX_SHIPPING = 100_000;

function cleanMoney(value: unknown, max: number): string | null {
  const raw = typeof value === "number" ? String(value) : value;
  if (typeof raw !== "string") return null;
  const s = raw.trim().replace(/,/g, "");
  if (!MONEY.test(s)) return null;
  return Number(s) <= max ? s : null;
}

export function validateOrderEdit(payload: unknown): ValidatedEdit {
  const p = (
    typeof payload === "object" && payload !== null ? payload : {}
  ) as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const orderId =
    typeof p.orderId === "string" && p.orderId.length > 0 && p.orderId.length <= 50
      ? p.orderId
      : null;
  if (!orderId) errors.form = "অর্ডার চেনা যায়নি। পেজ রিফ্রেশ করুন।";

  const items: { id: string; unitPrice: string }[] = [];
  if (!Array.isArray(p.items) || p.items.length === 0 || p.items.length > 50) {
    errors.form = "আইটেমের তথ্যে সমস্যা। পেজ রিফ্রেশ করুন।";
  } else {
    p.items.forEach((raw, i) => {
      const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
        string,
        unknown
      >;
      const id = typeof r.id === "string" && r.id.length <= 50 ? r.id : null;
      const price = cleanMoney(r.unitPrice, MAX_ITEM_PRICE);
      if (!id) errors.form = "আইটেমের তথ্যে সমস্যা। পেজ রিফ্রেশ করুন।";
      else if (price === null)
        errors[`items.${i}`] = "সঠিক দাম লিখুন (০ বা তার বেশি, দশমিকের পর ২ ঘর পর্যন্ত)";
      else items.push({ id, unitPrice: price });
    });
  }

  let zone: Zone | null = null;
  if (typeof p.zone === "string" && p.zone !== "") {
    if (isZone(p.zone)) zone = p.zone;
    else errors.zone = "এলাকা ঠিক নেই";
  }

  const shippingFee = cleanMoney(p.shippingFee, MAX_SHIPPING);
  if (shippingFee === null) errors.shippingFee = "সঠিক ডেলিভারি চার্জ লিখুন";

  let reason: string | null = null;
  if (typeof p.reason === "string" && p.reason.trim() !== "") {
    reason = p.reason.trim();
    if (reason.length > 200) errors.reason = "কারণ ২০০ অক্ষরের মধ্যে লিখুন";
  }

  if (Object.keys(errors).length > 0 || !orderId || shippingFee === null) {
    return { ok: false, errors };
  }
  return { ok: true, data: { orderId, items, zone, shippingFee, reason } };
}