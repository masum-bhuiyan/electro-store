import { isDivision, type Division } from "@/lib/shipping";

// lib/cart-store.ts-এর MAX_PER_ITEM-এর সাথে একই রাখতে হবে
export const MAX_QTY_PER_ITEM = 10;

export type CartLineInput = { variantId: string; quantity: number };

export type CustomerInput = {
  name: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  details: string;
  notes: string;
};

export type FieldErrors = Partial<Record<keyof CustomerInput, string>>;

export type ValidCustomer = {
  name: string;
  phone: string;
  division: Division;
  district: string;
  area: string;
  details: string;
  notes: string | null;
};

export type CustomerValidation =
  | { ok: true; data: ValidCustomer }
  | { ok: false; errors: FieldErrors };

const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

// "০১৭১২-৩৪৫৬৭৮", "+8801712345678" সবই "01712345678" হয়ে যাবে
export function normalizePhone(raw: string): string | null {
  let s = raw.trim().replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)));
  s = s.replace(/[\s-]/g, "");
  if (s.startsWith("+880")) s = "0" + s.slice(4);
  else if (s.startsWith("880")) s = "0" + s.slice(3);
  return /^01[3-9]\d{8}$/.test(s) ? s : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateCustomer(input: unknown): CustomerValidation {
  const raw = (
    typeof input === "object" && input !== null ? input : {}
  ) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const name = text(raw.name);
  if (name.length < 2 || name.length > 80) {
    errors.name = "নাম ২ থেকে ৮০ অক্ষরের মধ্যে লিখুন";
  }

  const phone = normalizePhone(text(raw.phone));
  if (!phone) {
    errors.phone = "সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)";
  }

  const division = text(raw.division);
  if (!isDivision(division)) {
    errors.division = "বিভাগ বাছাই করুন";
  }

  const district = text(raw.district);
  if (district.length < 2 || district.length > 50) {
    errors.district = "জেলার নাম লিখুন";
  }

  const area = text(raw.area);
  if (area.length < 2 || area.length > 80) {
    errors.area = "এলাকা বা থানার নাম লিখুন";
  }

  const details = text(raw.details);
  if (details.length < 5 || details.length > 200) {
    errors.details = "বাসা/রোড/গ্রামের বিস্তারিত ঠিকানা লিখুন (কমপক্ষে ৫ অক্ষর)";
  }

  const notes = text(raw.notes);
  if (notes.length > 300) {
    errors.notes = "নোট ৩০০ অক্ষরের বেশি হতে পারবে না";
  }

  if (Object.keys(errors).length > 0 || !phone || !isDivision(division)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { name, phone, division, district, area, details, notes: notes || null },
  };
}

// ব্রাউজার থেকে আসা কার্টের তালিকা যাচাই করে। একই ভ্যারিয়ান্ট দুইবার থাকলে যোগ করে দেয়
export function normalizeItems(input: unknown): CartLineInput[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > 30) {
    return null;
  }

  const merged = new Map<string, number>();
  for (const row of input) {
    if (typeof row !== "object" || row === null) return null;
    const { variantId, quantity } = row as Record<string, unknown>;

    if (typeof variantId !== "string" || variantId.length === 0 || variantId.length > 50) {
      return null;
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      return null;
    }
    merged.set(variantId, (merged.get(variantId) ?? 0) + quantity);
  }

  const items: CartLineInput[] = [];
  for (const [variantId, quantity] of merged) {
    if (quantity > MAX_QTY_PER_ITEM) return null;
    items.push({ variantId, quantity });
  }
  return items;
}