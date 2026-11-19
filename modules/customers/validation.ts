import { isCustomerType, type CustomerTypeKey } from "@/lib/customer-type";
import { normalizePhone } from "@/modules/orders/validation";

export type CustomerInput = {
  type: CustomerTypeKey;
  name: string;
  contactName: string | null;
  phone: string;
  address: string | null;
  note: string | null;
};

export type ValidatedCustomer =
  | { ok: true; data: CustomerInput }
  | { ok: false; errors: Record<string, string> };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateCustomer(payload: unknown): ValidatedCustomer {
  const p = (
    typeof payload === "object" && payload !== null ? payload : {}
  ) as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // ধরন না পাঠালে বা ভুল পাঠালে খুচরা ধরি
  const type: CustomerTypeKey = isCustomerType(p.type) ? p.type : "RETAIL";

  const name = text(p.name);
  if (name.length < 2 || name.length > 80) {
    errors.name = "২ থেকে ৮০ অক্ষরের মধ্যে নাম লিখুন";
  }

  const contactRaw = text(p.contactName);
  if (contactRaw.length > 80) errors.contactName = "৮০ অক্ষরের মধ্যে লিখুন";

  const phone = normalizePhone(text(p.phone));
  if (!phone) errors.phone = "সঠিক মোবাইল নম্বর লিখুন (যেমন 01XXXXXXXXX)";

  const addressRaw = text(p.address);
  if (addressRaw.length > 250) errors.address = "ঠিকানা ২৫০ অক্ষরের মধ্যে লিখুন";

  const noteRaw = text(p.note);
  if (noteRaw.length > 300) errors.note = "নোট ৩০০ অক্ষরের মধ্যে লিখুন";

  if (Object.keys(errors).length > 0 || !phone) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      type,
      name,
      // পাইকারি ছাড়া অন্য ধরনে যোগাযোগের নাম লাগে না
      contactName: type === "WHOLESALE" && contactRaw ? contactRaw : null,
      phone,
      address: addressRaw || null,
      note: noteRaw || null,
    },
  };
}