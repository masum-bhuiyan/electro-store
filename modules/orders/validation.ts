import { isZone, type Zone } from "@/lib/shipping";

// lib/cart-store.ts-এর MAX_PER_ITEM-এর সাথে একই রাখতে হবে
export const MAX_QTY_PER_ITEM = 10;

export type CartLineInput = { variantId: string; quantity: number };

// চেকআউট ফর্মের তিনটি ঘর + ঢাকার ভেতরে/বাইরে বাছাই
export type CustomerInput = {
  name: string;
  phone: string;
  address: string;
  zone: string;
};

export type FieldErrors = Partial<Record<keyof CustomerInput, string>>;

export type ValidCustomer = {
  name: string;
  phone: string;
  address: string;
  zone: Zone;
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

  const address = text(raw.address);
  if (address.length < 10 || address.length > 250) {
    errors.address = "বাসা/রোড, এলাকা ও জেলাসহ পুরো ঠিকানা লিখুন (কমপক্ষে ১০ অক্ষর)";
  }

  const zone = text(raw.zone);
  if (!isZone(zone)) {
    errors.zone = "ঢাকার ভেতরে না বাইরে, বাছাই করুন";
  }

  if (Object.keys(errors).length > 0 || !phone || !isZone(zone)) {
    return { ok: false, errors };
  }

  return { ok: true, data: { name, phone, address, zone } };
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

// অর্ডার নম্বরের ফরম্যাট: ES-YYMMDD-XXXXXX (0, 1, I, L, O বাদ)
const ORDER_NUMBER_PATTERN = /^ES-\d{6}-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$/;

export function normalizeOrderNumber(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toUpperCase().replace(/\s/g, "");
  return ORDER_NUMBER_PATTERN.test(s) ? s : null;
}