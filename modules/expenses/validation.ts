import { Prisma } from "@/generated/prisma/client";
import { SALE_PAY_METHODS, type SalePayMethodKey } from "@/modules/sales/validation";

const MAX_EXPENSE = 100_000_000;

// ঢাকার আজকের তারিখ, YYYY-MM-DD
export function dhakaToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

export type ExpenseInput = {
  categoryId: string;
  amount: Prisma.Decimal;
  method: SalePayMethodKey;
  expenseDate: Date;
  note: string | null;
  supplierId: string | null;
};

export type ValidateExpenseResult =
  | { ok: true; data: ExpenseInput }
  | { ok: false; message: string };

export function validateExpense(raw: unknown): ValidateExpenseResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "তথ্য ঠিক নেই।" };
  }
  const r = raw as Record<string, unknown>;

  const categoryId = String(r.categoryId ?? "").trim().slice(0, 100);
  if (!categoryId) return { ok: false, message: "খরচের ক্যাটাগরি বাছুন।" };

  const amountText = String(r.amount ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
    return { ok: false, message: "টাকার পরিমাণ ঠিক নেই (সর্বোচ্চ ২ দশমিক)।" };
  }
  const amount = new Prisma.Decimal(amountText);
  if (amount.lte(0) || amount.gt(MAX_EXPENSE)) {
    return { ok: false, message: "টাকা ০-এর বেশি ও ১০ কোটির মধ্যে হতে হবে।" };
  }

  const method = (SALE_PAY_METHODS as readonly string[]).includes(String(r.method))
    ? (r.method as SalePayMethodKey)
    : "CASH";

  const dateText = String(r.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return { ok: false, message: "তারিখ ঠিক নেই।" };
  }
  const expenseDate = new Date(`${dateText}T00:00:00+06:00`);
  if (Number.isNaN(expenseDate.getTime())) {
    return { ok: false, message: "তারিখ ঠিক নেই।" };
  }
  if (dateText > dhakaToday()) {
    return { ok: false, message: "ভবিষ্যতের তারিখ দেওয়া যাবে না।" };
  }
  if (dateText < "2020-01-01") {
    return { ok: false, message: "তারিখ অনেক পুরনো, ঠিক করুন।" };
  }

  const noteText = String(r.note ?? "").trim().slice(0, 300);
  const supplierText = String(r.supplierId ?? "").trim().slice(0, 100);

  return {
    ok: true,
    data: {
      categoryId,
      amount,
      method,
      expenseDate,
      note: noteText === "" ? null : noteText,
      supplierId: supplierText === "" ? null : supplierText,
    },
  };
}

export function validateCategoryName(
  raw: unknown
): { ok: true; name: string } | { ok: false; message: string } {
  const name = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) {
    return { ok: false, message: "ক্যাটাগরির নাম ২ থেকে ৪০ অক্ষরের মধ্যে হতে হবে।" };
  }
  return { ok: true, name };
}