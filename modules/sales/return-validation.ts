import { MAX_STOCK } from "@/modules/inventory/validation";

export type SaleReturnInput = {
  saleId: string;
  note: string | null;
  items: { saleItemId: string; quantity: number }[];
};

export type ValidateSaleReturnResult =
  | { ok: true; data: SaleReturnInput }
  | { ok: false; message: string };

export function validateSaleReturn(raw: unknown): ValidateSaleReturnResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "তথ্য ঠিক নেই।" };
  }
  const r = raw as Record<string, unknown>;

  const saleId = String(r.saleId ?? "").trim().slice(0, 100);
  if (!saleId) return { ok: false, message: "বিক্রয় ঠিক নেই।" };

  if (!Array.isArray(r.items) || r.items.length > 100) {
    return { ok: false, message: "ফেরতের তালিকা ঠিক নেই।" };
  }

  const items: SaleReturnInput["items"] = [];
  const seen = new Set<string>();
  for (const rawItem of r.items) {
    const it = (rawItem ?? {}) as Record<string, unknown>;
    const saleItemId = String(it.saleItemId ?? "").trim().slice(0, 100);
    if (!saleItemId) return { ok: false, message: "পণ্য ঠিক নেই।" };
    if (seen.has(saleItemId)) {
      return { ok: false, message: "একই পণ্য দুইবার দেওয়া যাবে না।" };
    }
    seen.add(saleItemId);

    const quantity = Number(it.quantity);
    // ০ হলে ওই লাইন ফেরত নেই, বাদ
    if (quantity === 0) continue;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_STOCK) {
      return { ok: false, message: "ফেরতের পরিমাণ ঠিক নেই (পূর্ণ সংখ্যা)।" };
    }
    items.push({ saleItemId, quantity });
  }

  if (items.length === 0) {
    return { ok: false, message: "কমপক্ষে একটি পণ্যের ফেরত পরিমাণ দিন।" };
  }

  const noteText = String(r.note ?? "").trim().slice(0, 300);
  return {
    ok: true,
    data: { saleId, note: noteText === "" ? null : noteText, items },
  };
}