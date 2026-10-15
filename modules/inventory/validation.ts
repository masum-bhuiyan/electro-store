export const MAX_ADJUST = 100000;
export const MAX_STOCK = 1000000;

export type AdjustAction = "PURCHASE_IN" | "ADJUST_UP" | "ADJUST_DOWN";

const ACTIONS: AdjustAction[] = ["PURCHASE_IN", "ADJUST_UP", "ADJUST_DOWN"];

export type AdjustInput = {
  variantId: string;
  // বাড়লে ধনাত্মক, কমলে ঋণাত্মক, কখনো ০ নয়
  delta: number;
  reason: "PURCHASE" | "ADJUSTMENT";
  note: string | null;
};

export type AdjustErrors = Partial<
  Record<"variantId" | "action" | "amount" | "note", string>
>;

export type AdjustValidation =
  | { ok: true; data: AdjustInput }
  | { ok: false; errors: AdjustErrors };

const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

function toEnglishDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)));
}

export function validateAdjustment(input: unknown): AdjustValidation {
  const raw = (
    typeof input === "object" && input !== null ? input : {}
  ) as Record<string, unknown>;
  const errors: AdjustErrors = {};

  const variantId =
    typeof raw.variantId === "string" ? raw.variantId.trim() : "";
  if (!variantId || variantId.length > 50) {
    errors.variantId = "ভ্যারিয়ান্ট চেনা যায়নি। পেজ রিফ্রেশ করুন।";
  }

  const action = ACTIONS.find((a) => a === raw.action);
  if (!action) errors.action = "কী করবেন তা বাছাই করুন";

  const amountText =
    typeof raw.amount === "string" ? toEnglishDigits(raw.amount.trim()) : "";
  const amount = /^\d{1,6}$/.test(amountText) ? Number(amountText) : NaN;
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_ADJUST) {
    errors.amount = "১ থেকে ১,০০,০০০ এর মধ্যে একটা পূর্ণসংখ্যা দিন";
  }

  const note = typeof raw.note === "string" ? raw.note.trim() : "";
  if (note.length > 200) {
    errors.note = "নোট ২০০ অক্ষরের বেশি হতে পারবে না";
  } else if (action && action !== "PURCHASE_IN" && note.length < 3) {
    errors.note =
      "সংশোধনের কারণ লিখুন (কমপক্ষে ৩ অক্ষর), যেমন: গণনায় ভুল, নষ্ট, হারিয়েছে";
  }

  if (Object.keys(errors).length > 0 || !action) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      variantId,
      delta: action === "ADJUST_DOWN" ? -amount : amount,
      reason: action === "PURCHASE_IN" ? "PURCHASE" : "ADJUSTMENT",
      note: note || null,
    },
  };
}