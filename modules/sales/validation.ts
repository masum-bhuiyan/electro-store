import { Prisma } from "@/generated/prisma/client";
import { isCustomerType, type CustomerTypeKey } from "@/lib/customer-type";
import { MAX_STOCK } from "@/modules/inventory/validation";
import { normalizePhone } from "@/modules/orders/validation";

export const MAX_SALE_ITEMS = 100;
const MAX_UNIT_PRICE = 10_000_000;
const MAX_TOTAL = 9_999_999_999;

export const SALE_PAY_METHODS = ["CASH", "BKASH", "NAGAD", "BANK"] as const;
export type SalePayMethodKey = (typeof SALE_PAY_METHODS)[number];

export const SALE_PAY_LABELS: Record<SalePayMethodKey, string> = {
  CASH: "নগদ",
  BKASH: "bKash",
  NAGAD: "Nagad",
  BANK: "ব্যাংক",
};

export type SaleStatusKey = "DRAFT" | "CONFIRMED";

export type SaleItemInput = {
  variantId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
};

export type SaleInput = {
  status: SaleStatusKey;
  // খালি হলে walk-in
  customerId: string | null;
  customerType: CustomerTypeKey;
  // সেভ করা ক্রেতা না বাছলে, নাম+ফোন দিয়ে পুরনো ক্রেতা খোঁজা বা নতুন বানানো
  newCustomer: { name: string | null; phone: string; type: CustomerTypeKey } | null;
  // শুধু ড্রাফটে: ফোন ছাড়া শুধু নাম দিলে (ক্রেতার রেকর্ড বানানো হয় না)
  looseName: string | null;
  note: string | null;
  payMethod: SalePayMethodKey;
  paid: Prisma.Decimal;
  extraDiscount: Prisma.Decimal;
  items: SaleItemInput[];
};

export type ValidateSaleResult =
  | { ok: true; data: SaleInput }
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

export function validateSale(
  raw: unknown,
  status: SaleStatusKey = "CONFIRMED"
): ValidateSaleResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "তথ্য ঠিক নেই।" };
  }
  const r = raw as Record<string, unknown>;

  if (!Array.isArray(r.items) || r.items.length === 0) {
    return { ok: false, message: "কমপক্ষে একটি পণ্য যোগ করুন।" };
  }
  if (r.items.length > MAX_SALE_ITEMS) {
    return {
      ok: false,
      message: `একটি বিক্রয়ে সর্বোচ্চ ${MAX_SALE_ITEMS}টি পণ্য দেওয়া যাবে।`,
    };
  }

  const customerType = isCustomerType(r.customerType) ? r.customerType : "RETAIL";
  const customerId = text(r.customerId, 100);

  let newCustomer: SaleInput["newCustomer"] = null;
  const newPhoneRaw = String(r.newPhone ?? "").trim();
  if (!customerId && newPhoneRaw !== "") {
    const phone = normalizePhone(newPhoneRaw);
    if (!phone) {
      return { ok: false, message: "ক্রেতার মোবাইল নম্বর ঠিক নেই (যেমন 01712345678)।" };
    }
    const nm = text(r.newName, 80);
    if (nm !== null && nm.length < 2) {
      return { ok: false, message: "ক্রেতার নাম কমপক্ষে ২ অক্ষর লিখুন।" };
    }
    newCustomer = {
      name: nm,
      phone,
      type: isCustomerType(r.newType) ? r.newType : "RETAIL",
    };
  }

  // ফোন ছাড়া শুধু নাম: শুধু ড্রাফটে কাজে লাগে
  let looseName: string | null = null;
  if (status === "DRAFT" && !customerId && !newCustomer) {
    looseName = text(r.newName, 80);
    if (looseName !== null && looseName.length < 2) {
      return { ok: false, message: "ক্রেতার নাম কমপক্ষে ২ অক্ষর লিখুন।" };
    }
    if (looseName === null) {
      return { ok: false, message: "ড্রাফটে ক্রেতার নাম বা মোবাইল নম্বর দিন।" };
    }
  }

  const payMethod = (SALE_PAY_METHODS as readonly string[]).includes(
    String(r.payMethod)
  )
    ? (r.payMethod as SalePayMethodKey)
    : "CASH";

  const items: SaleItemInput[] = [];
  const seen = new Set<string>();
  let total = new Prisma.Decimal(0);

  for (const rawItem of r.items) {
    const it = (rawItem ?? {}) as Record<string, unknown>;

    const variantId = text(it.variantId, 100);
    if (!variantId) return { ok: false, message: "পণ্য ঠিক নেই।" };
    if (seen.has(variantId)) {
      return { ok: false, message: "একই পণ্য দুইবার যোগ করা যাবে না।" };
    }
    seen.add(variantId);

    const quantity = Number(it.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_STOCK) {
      return { ok: false, message: "পরিমাণ ঠিক নেই (পূর্ণ সংখ্যা, ১ বা বেশি)।" };
    }

    const unitPrice = parseMoney(it.unitPrice);
    if (!unitPrice || unitPrice.lte(0) || unitPrice.gt(MAX_UNIT_PRICE)) {
      return {
        ok: false,
        message: "বিক্রয় দাম ঠিক নেই (০-এর বেশি, সর্বোচ্চ ২ দশমিক)।",
      };
    }

    total = total.plus(unitPrice.times(quantity));
    items.push({ variantId, quantity, unitPrice });
  }

  if (total.gt(MAX_TOTAL)) {
    return { ok: false, message: "মোট টাকা অনেক বেশি হয়ে গেছে।" };
  }

  const extraDiscount = parseMoney(
    String(r.extraDiscount ?? "").trim() === "" ? "0" : r.extraDiscount
  );
  if (!extraDiscount) {
    return { ok: false, message: "অতিরিক্ত ছাড়ের টাকা ঠিক নেই।" };
  }
  if (extraDiscount.gt(0) && extraDiscount.gte(total)) {
    return { ok: false, message: "অতিরিক্ত ছাড় মোটের চেয়ে কম হতে হবে।" };
  }
  const netTotal = total.minus(extraDiscount);

  const paid = parseMoney(
    String(r.paid ?? "").trim() === "" ? "0" : r.paid
  );
  if (!paid) return { ok: false, message: "পরিশোধের টাকা ঠিক নেই।" };
  if (paid.gt(netTotal)) {
    return { ok: false, message: "পরিশোধ প্রদেয় মোটের চেয়ে বেশি হতে পারে না।" };
  }

  return {
    ok: true,
    data: {
      status,
      customerId,
      customerType,
      newCustomer,
      looseName,
      note: text(r.note, 500),
      payMethod,
      paid,
      extraDiscount,
      items,
    },
  };
}