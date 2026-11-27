import { dhakaToday } from "@/modules/expenses/validation";

export type SalesType = "ALL" | "RETAIL" | "WHOLESALE";

export type ParsedRange = {
  from: string;
  to: string;
  type: SalesType;
  error: string | null;
};

const MAX_DAYS = 366;

function isDate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000) + 1;
}

// "2026-11" থেকে মাসের প্রথম ও শেষ দিন
function monthBounds(ym: string): { from: string; to: string } | null {
  if (!/^\d{4}-\d{2}$/.test(ym)) return null;
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  if (m < 1 || m > 12) return null;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, "0")}` };
}

export function parseRange(sp: {
  from?: string;
  to?: string;
  month?: string;
  type?: string;
}): ParsedRange {
  const today = dhakaToday();
  const type: SalesType =
    sp.type === "RETAIL" || sp.type === "WHOLESALE" ? sp.type : "ALL";

  let from = today.slice(0, 8) + "01";
  let to = today;
  let error: string | null = null;

  const mb = sp.month ? monthBounds(sp.month) : null;
  if (mb) {
    from = mb.from;
    to = mb.to;
  } else if (sp.from || sp.to) {
    if (isDate(sp.from) && isDate(sp.to)) {
      from = sp.from;
      to = sp.to;
    } else {
      error = "তারিখ ঠিকমতো দেওয়া হয়নি, তাই এই মাসের রিপোর্ট দেখানো হচ্ছে।";
    }
  }

  // ভবিষ্যতের দিন কেটে আজ পর্যন্ত
  if (to > today) to = today;
  if (from > to) {
    if (!error) error = "শুরুর তারিখ শেষের তারিখের পরে হতে পারে না।";
    from = today.slice(0, 8) + "01";
    to = today;
  }
  if (daysBetween(from, to) > MAX_DAYS) {
    error = `একবারে সর্বোচ্চ ${MAX_DAYS} দিনের রিপোর্ট হয়। এই মাসের রিপোর্ট দেখানো হচ্ছে।`;
    from = today.slice(0, 8) + "01";
    to = today;
  }

  return { from, to, type, error };
}