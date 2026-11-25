import { Prisma } from "@/generated/prisma/client";

const MAX_OPENING = 100_000_000;

export type OpeningInput = {
  party: "customer" | "supplier";
  partyId: string;
  amount: Prisma.Decimal;
  // DUE = বাকি (ক্রেতা আমাদের দেবে / আমরা সাপ্লায়ারকে দেব), ADVANCE = উল্টো দিক
  direction: "DUE" | "ADVANCE";
};

export type ValidateOpeningResult =
  | { ok: true; data: OpeningInput }
  | { ok: false; message: string };

export function validateOpening(raw: unknown): ValidateOpeningResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "তথ্য ঠিক নেই।" };
  }
  const r = raw as Record<string, unknown>;

  const party = r.party === "supplier" ? "supplier" : r.party === "customer" ? "customer" : null;
  if (!party) return { ok: false, message: "পক্ষ ঠিক নেই।" };

  const partyId = String(r.partyId ?? "").trim().slice(0, 100);
  if (!partyId) return { ok: false, message: "পক্ষ ঠিক নেই।" };

  const amountText = String(r.amount ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
    return { ok: false, message: "টাকার পরিমাণ ঠিক নেই (সর্বোচ্চ ২ দশমিক)।" };
  }
  const amount = new Prisma.Decimal(amountText);
  if (amount.lte(0) || amount.gt(MAX_OPENING)) {
    return { ok: false, message: "টাকা ০-এর বেশি ও ১০ কোটির মধ্যে হতে হবে।" };
  }

  const direction = r.direction === "ADVANCE" ? "ADVANCE" : "DUE";

  return { ok: true, data: { party, partyId, amount, direction } };
}