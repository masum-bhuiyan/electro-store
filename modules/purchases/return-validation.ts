import { Prisma } from "@/generated/prisma/client";

export type ReturnItemInput = { purchaseItemId: string; quantity: number };

export type PurchaseReturnInput = {
  purchaseId: string;
  note: string | null;
  cashReceived: Prisma.Decimal;
  items: ReturnItemInput[];
};

export type ValidateReturnResult =
  | { ok: true; data: PurchaseReturnInput }
  | { ok: false; message: string };

function parseMoney(value: unknown): Prisma.Decimal | null {
  const s = String(value ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return new Prisma.Decimal(s);
}

function text(value: unknown, max: number): string | null {
  const s = String(value ?? "").trim().slice(0, max);
  return s === "" ? null : s;
}

export function validatePurchaseReturn(raw: unknown): ValidateReturnResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "তথ্য ঠিক নেই।" };
  }
  const r = raw as Record<string, unknown>;

  const purchaseId = text(r.purchaseId, 100);
  if (!purchaseId) return { ok: false, message: "ক্রয় চেনা যায়নি।" };

  if (!Array.isArray(r.items) || r.items.length > 100) {
    return { ok: false, message: "পণ্যের তথ্য ঠিক নেই।" };
  }

  const items: ReturnItemInput[] = [];
  const seen = new Set<string>();

  for (const rawItem of r.items) {
    const it = (rawItem ?? {}) as Record<string, unknown>;
    const raw = String(it.quantity ?? "").trim();
    // ফাঁকা বা ০ হলে ওই পণ্য ফেরতে ধরা হবে না
    if (raw === "" || raw === "0") continue;

    const purchaseItemId = text(it.purchaseItemId, 100);
    if (!purchaseItemId) return { ok: false, message: "পণ্য ঠিক নেই।" };
    if (seen.has(purchaseItemId)) {
      return { ok: false, message: "একই পণ্য দুইবার এসেছে।" };
    }
    seen.add(purchaseItemId);

    const quantity = Number(raw);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000) {
      return { ok: false, message: "ফেরতের পরিমাণ ঠিক নেই (পূর্ণ সংখ্যা)।" };
    }
    items.push({ purchaseItemId, quantity });
  }

  if (items.length === 0) {
    return { ok: false, message: "কমপক্ষে একটি পণ্যের ফেরতের পরিমাণ দিন।" };
  }

  const cashReceived = parseMoney(
    String(r.cashReceived ?? "").trim() === "" ? "0" : r.cashReceived
  );
  if (!cashReceived) {
    return { ok: false, message: "নগদ ফেরতের টাকা ঠিক নেই।" };
  }

  return {
    ok: true,
    data: { purchaseId, note: text(r.note, 500), cashReceived, items },
  };
}