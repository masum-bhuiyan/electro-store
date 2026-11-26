import { Prisma } from "@/generated/prisma/client";
import { CASH_KINDS, type CashKindKey } from "@/lib/cash-kind";
import { dhakaToday } from "@/modules/expenses/validation";
import { SALE_PAY_METHODS, type SalePayMethodKey } from "@/modules/sales/validation";

const MAX_CASH = 1_000_000_000;

export type CashEntryInput = {
  kind: CashKindKey;
  method: SalePayMethodKey;
  // শুধু TRANSFER-এ
  toMethod: SalePayMethodKey | null;
  amount: Prisma.Decimal;
  charge: Prisma.Decimal;
  entryDate: Date;
  note: string | null;
};

export type ValidateCashResult =
  | { ok: true; data: CashEntryInput }
  | { ok: false; message: string };

function isMethod(v: unknown): v is SalePayMethodKey {
  return (SALE_PAY_METHODS as readonly string[]).includes(String(v));
}

export function validateCashEntry(raw: unknown): ValidateCashResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "তথ্য ঠিক নেই।" };
  }
  const r = raw as Record<string, unknown>;

  if (!(CASH_KINDS as readonly string[]).includes(String(r.kind))) {
    return { ok: false, message: "ধরন বাছুন।" };
  }
  const kind = r.kind as CashKindKey;

  if (!isMethod(r.method)) {
    return { ok: false, message: "মাধ্যম বাছুন।" };
  }
  const method = r.method;

  const amountText = String(r.amount ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
    return { ok: false, message: "টাকার পরিমাণ ঠিক নেই (সর্বোচ্চ ২ দশমিক)।" };
  }
  const amount = new Prisma.Decimal(amountText);
  if (amount.lte(0) || amount.gt(MAX_CASH)) {
    return { ok: false, message: "টাকা ০-এর বেশি ও ১০০ কোটির মধ্যে হতে হবে।" };
  }

  let toMethod: SalePayMethodKey | null = null;
  let charge = new Prisma.Decimal(0);
  if (kind === "TRANSFER") {
    if (!isMethod(r.toMethod)) {
      return { ok: false, message: "কোন মাধ্যমে যাচ্ছে তা বাছুন।" };
    }
    toMethod = r.toMethod;
    if (toMethod === method) {
      return { ok: false, message: "যেখান থেকে আর যেখানে, দুটো আলাদা হতে হবে।" };
    }

    const chargeText = String(r.charge ?? "").trim();
    if (chargeText !== "") {
      if (!/^\d+(\.\d{1,2})?$/.test(chargeText)) {
        return { ok: false, message: "চার্জের পরিমাণ ঠিক নেই (সর্বোচ্চ ২ দশমিক)।" };
      }
      charge = new Prisma.Decimal(chargeText);
      if (charge.gt(amount)) {
        return { ok: false, message: "চার্জ স্থানান্তরের টাকার চেয়ে বেশি হতে পারে না।" };
      }
    }
  }

  const dateText = String(r.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return { ok: false, message: "তারিখ ঠিক নেই।" };
  }
  const entryDate = new Date(`${dateText}T00:00:00+06:00`);
  if (Number.isNaN(entryDate.getTime())) {
    return { ok: false, message: "তারিখ ঠিক নেই।" };
  }
  if (dateText > dhakaToday()) {
    return { ok: false, message: "ভবিষ্যতের তারিখ দেওয়া যাবে না।" };
  }
  if (dateText < "2020-01-01") {
    return { ok: false, message: "তারিখ অনেক পুরনো, ঠিক করুন।" };
  }

  const noteText = String(r.note ?? "").trim().slice(0, 300);

  return {
    ok: true,
    data: {
      kind,
      method,
      toMethod,
      amount,
      charge,
      entryDate,
      note: noteText === "" ? null : noteText,
    },
  };
}