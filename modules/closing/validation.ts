import { Prisma } from "@/generated/prisma/client";
import { dhakaToday } from "@/modules/expenses/validation";
import { SALE_PAY_METHODS, type SalePayMethodKey } from "@/modules/sales/validation";

export type ClosingInput = {
  date: string;
  lines: { method: SalePayMethodKey; counted: Prisma.Decimal; reason: string | null }[];
};

export type ValidateClosingResult =
  | { ok: true; data: ClosingInput }
  | { ok: false; message: string };

export function validateClosing(raw: unknown): ValidateClosingResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "তথ্য ঠিক নেই।" };
  }
  const r = raw as Record<string, unknown>;

  const date = String(r.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00+06:00`).getTime())) {
    return { ok: false, message: "তারিখ ঠিক নেই।" };
  }
  if (date > dhakaToday()) return { ok: false, message: "ভবিষ্যতের তারিখে সমাপ্তি দেওয়া যাবে না।" };
  if (date < "2020-01-01") return { ok: false, message: "তারিখ অনেক পুরনো।" };

  if (!Array.isArray(r.lines) || r.lines.length > 4) {
    return { ok: false, message: "হিসাবের তালিকা ঠিক নেই।" };
  }

  const lines: ClosingInput["lines"] = [];
  const seen = new Set<string>();
  for (const raw of r.lines) {
    const l = (raw ?? {}) as Record<string, unknown>;
    const method = String(l.method ?? "");
    if (!(SALE_PAY_METHODS as readonly string[]).includes(method) || seen.has(method)) {
      return { ok: false, message: "মাধ্যম ঠিক নেই।" };
    }
    seen.add(method);

    const text = String(l.counted ?? "").trim();
    if (!/^\d+(\.\d{1,2})?$/.test(text)) {
      return { ok: false, message: "গোনা টাকার পরিমাণ ঠিক নেই (০ বা তার বেশি, সর্বোচ্চ ২ দশমিক)।" };
    }
    const counted = new Prisma.Decimal(text);
    if (counted.gt(1_000_000_000)) {
      return { ok: false, message: "টাকা অনেক বেশি।" };
    }

    const reasonText = String(l.reason ?? "").trim().slice(0, 300);
    lines.push({
      method: method as SalePayMethodKey,
      counted,
      reason: reasonText === "" ? null : reasonText,
    });
  }

  return { ok: true, data: { date, lines } };
}