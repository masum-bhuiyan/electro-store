import { Prisma } from "@/generated/prisma/client";
import {
  SALE_PAY_METHODS,
  type SalePayMethodKey,
} from "@/modules/sales/validation";

const MAX_PAYMENT = 10_000_000;

export type PaymentInput = {
  partyId: string;
  amount: Prisma.Decimal;
  method: SalePayMethodKey;
  note: string | null;
};

export type ValidatePaymentResult =
  | { ok: true; data: PaymentInput }
  | { ok: false; message: string };

export function validatePayment(raw: unknown): ValidatePaymentResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "তথ্য ঠিক নেই।" };
  }
  const r = raw as Record<string, unknown>;

  const partyId = String(r.partyId ?? "").trim().slice(0, 100);
  if (!partyId) return { ok: false, message: "পক্ষ ঠিক নেই।" };

  const amountText = String(r.amount ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
    return { ok: false, message: "টাকার পরিমাণ ঠিক নেই (সর্বোচ্চ ২ দশমিক)।" };
  }
  const amount = new Prisma.Decimal(amountText);
  if (amount.lte(0) || amount.gt(MAX_PAYMENT)) {
    return { ok: false, message: "টাকা ০-এর বেশি ও ১ কোটির মধ্যে হতে হবে।" };
  }

  const method = (SALE_PAY_METHODS as readonly string[]).includes(String(r.method))
    ? (r.method as SalePayMethodKey)
    : "CASH";

  const noteText = String(r.note ?? "").trim().slice(0, 300);

  return {
    ok: true,
    data: { partyId, amount, method, note: noteText === "" ? null : noteText },
  };
}