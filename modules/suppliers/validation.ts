import { normalizePhone } from "@/modules/orders/validation";

export type SupplierInput = {
  name: string;
  contactName: string | null;
  phone: string | null;
  address: string | null;
  note: string | null;
};

export type ValidatedSupplier =
  | { ok: true; data: SupplierInput }
  | { ok: false; errors: Record<string, string> };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateSupplier(payload: unknown): ValidatedSupplier {
  const p = (
    typeof payload === "object" && payload !== null ? payload : {}
  ) as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const name = text(p.name);
  if (name.length < 2 || name.length > 80) {
    errors.name = "২ থেকে ৮০ অক্ষরের মধ্যে নাম লিখুন";
  }

  const contactRaw = text(p.contactName);
  if (contactRaw.length > 80) errors.contactName = "৮০ অক্ষরের মধ্যে লিখুন";

  // ফোন ঐচ্ছিক। দিলে সঠিক হতে হবে
  const phoneRaw = text(p.phone);
  let phone: string | null = null;
  if (phoneRaw) {
    phone = normalizePhone(phoneRaw);
    if (!phone) errors.phone = "সঠিক মোবাইল নম্বর লিখুন (যেমন 01XXXXXXXXX)";
  }

  const addressRaw = text(p.address);
  if (addressRaw.length > 250) errors.address = "ঠিকানা ২৫০ অক্ষরের মধ্যে লিখুন";

  const noteRaw = text(p.note);
  if (noteRaw.length > 300) errors.note = "নোট ৩০০ অক্ষরের মধ্যে লিখুন";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      name,
      contactName: contactRaw || null,
      phone,
      address: addressRaw || null,
      note: noteRaw || null,
    },
  };
}