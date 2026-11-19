import { Prisma } from "@/generated/prisma/client";
import { MAX_STOCK } from "@/modules/inventory/validation";

export const MAX_PURCHASE_ITEMS = 100;
const MAX_UNIT_COST = 10_000_000;
const MAX_TOTAL = 9_999_999_999;

export type PurchaseItemInput = {
  variantId: string;
  quantity: number;
  unitCost: Prisma.Decimal;
  newPrice: Prisma.Decimal | null;
};

export type PurchaseInput = {
  supplierId: string;
  billNo: string | null;
  note: string | null;
  paid: Prisma.Decimal;
  items: PurchaseItemInput[];
};

export type ValidatePurchaseResult =
  | { ok: true; data: PurchaseInput }
  | { ok: false; message: string };

// "1250" বা "1250.50" (সর্বোচ্চ ২ দশমিক) হলে Decimal, নইলে null
function parseMoney(value: unknown): Prisma.Decimal | null {
  const s = String(value ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return new Prisma.Decimal(s);
}

function text(value: unknown, max: number): string | null {
  const s = String(value ?? "").trim().slice(0, max);
  return s === "" ? null : s;
}

export function validatePurchase(raw: unknown): ValidatePurchaseResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "তথ্য ঠিক নেই।" };
  }
  const r = raw as Record<string, unknown>;

  const supplierId = text(r.supplierId, 100);
  if (!supplierId) return { ok: false, message: "সাপ্লায়ার বাছুন।" };

  if (!Array.isArray(r.items) || r.items.length === 0) {
    return { ok: false, message: "কমপক্ষে একটি পণ্য যোগ করুন।" };
  }
  if (r.items.length > MAX_PURCHASE_ITEMS) {
    return {
      ok: false,
      message: `একটি বিলে সর্বোচ্চ ${MAX_PURCHASE_ITEMS}টি পণ্য দেওয়া যাবে।`,
    };
  }

  const items: PurchaseItemInput[] = [];
  const seen = new Set<string>();
  let total = new Prisma.Decimal(0);

  for (const rawItem of r.items) {
    const it = (rawItem ?? {}) as Record<string, unknown>;

    const variantId = text(it.variantId, 100);
    if (!variantId) return { ok: false, message: "পণ্য ঠিক নেই।" };
    if (seen.has(variantId)) {
      return { ok: false, message: "একই পণ্য দুইবার যোগ করা যাবে না।" };
    }
    seen.add(variantId);

    const quantity = Number(it.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_STOCK) {
      return { ok: false, message: "পরিমাণ ঠিক নেই (পূর্ণ সংখ্যা, ১ বা বেশি)।" };
    }

    const unitCost = parseMoney(it.unitCost);
    if (!unitCost || unitCost.lte(0) || unitCost.gt(MAX_UNIT_COST)) {
      return {
        ok: false,
        message: "কেনা দাম ঠিক নেই (০-এর বেশি, সর্বোচ্চ ২ দশমিক)।",
      };
    }

    let newPrice: Prisma.Decimal | null = null;
    const rawPrice = String(it.newPrice ?? "").trim();
    if (rawPrice !== "") {
      newPrice = parseMoney(rawPrice);
      if (!newPrice || newPrice.lte(0) || newPrice.gt(MAX_UNIT_COST)) {
        return { ok: false, message: "নতুন বিক্রয় দাম ঠিক নেই।" };
      }
    }

    total = total.plus(unitCost.times(quantity));
    items.push({ variantId, quantity, unitCost, newPrice });
  }

  if (total.gt(MAX_TOTAL)) {
    return { ok: false, message: "বিলের মোট টাকা অনেক বেশি হয়ে গেছে।" };
  }

  const paid = parseMoney(r.paid === "" ? "0" : r.paid);
  if (!paid) return { ok: false, message: "পরিশোধের টাকা ঠিক নেই।" };
  if (paid.gt(total)) {
    return { ok: false, message: "পরিশোধ বিলের মোটের চেয়ে বেশি হতে পারে না।" };
  }

  return {
    ok: true,
    data: {
      supplierId,
      billNo: text(r.billNo, 60),
      note: text(r.note, 500),
      paid,
      items,
    },
  };
}