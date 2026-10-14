export type VariantInput = {
  id: string | null;
  sku: string;
  color: string | null;
  storage: string | null;
  price: number;
  comparePrice: number | null;
  costPrice: number | null;
  // শুধু নতুন ভ্যারিয়ান্টে কাজে লাগে; বিদ্যমানের স্টক এখানে বদলায় না
  stock: number;
};

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  model: string | null;
  categoryId: string;
  brandId: string;
  warrantyMonths: number;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
  specs: Record<string, string>;
  variants: VariantInput[];
};

export type ProductErrors = Record<string, string>;

export type ProductValidation =
  | { ok: true; data: ProductInput }
  | { ok: false; errors: ProductErrors };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const BLOCKED_SPEC_KEYS = ["__proto__", "constructor", "prototype"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isBlank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

// সর্বোচ্চ ৮ অঙ্ক, দশমিকের পর সর্বোচ্চ ২ অঙ্ক। ভুল হলে null
function parseMoney(v: unknown): number | null {
  const s = typeof v === "number" ? String(v) : str(v);
  return /^\d{1,8}(\.\d{1,2})?$/.test(s) ? Number(s) : null;
}

// অঋণাত্মক পূর্ণসংখ্যা, max-এর বেশি হলে null
function parseInteger(v: unknown, max: number): number | null {
  const s = typeof v === "number" ? String(v) : str(v);
  if (!/^\d{1,7}$/.test(s)) return null;
  const n = Number(s);
  return n <= max ? n : null;
}

function isHttpsUrl(s: string): boolean {
  if (s.length > 500) return false;
  try {
    return new URL(s).protocol === "https:";
  } catch {
    return false;
  }
}

export function validateProduct(input: unknown): ProductValidation {
  const raw = isRecord(input) ? input : {};
  const errors: ProductErrors = {};

  const name = str(raw.name);
  if (name.length < 2 || name.length > 150) {
    errors.name = "নাম ২ থেকে ১৫০ অক্ষরের মধ্যে লিখুন";
  }

  const slug = str(raw.slug).toLowerCase();
  if (slug.length < 2 || slug.length > 100 || !SLUG_PATTERN.test(slug)) {
    errors.slug =
      "slug-এ শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও মাঝে - চলবে (যেমন samsung-galaxy-a55)";
  }

  const description = str(raw.description);
  if (description.length < 10 || description.length > 5000) {
    errors.description = "বিবরণ ১০ থেকে ৫০০০ অক্ষরের মধ্যে লিখুন";
  }

  const modelText = str(raw.model);
  if (modelText.length > 80) {
    errors.model = "মডেল ৮০ অক্ষরের বেশি হতে পারবে না";
  }

  const categoryId = str(raw.categoryId);
  if (!categoryId || categoryId.length > 50) {
    errors.categoryId = "ক্যাটাগরি বাছাই করুন";
  }

  const brandId = str(raw.brandId);
  if (!brandId || brandId.length > 50) {
    errors.brandId = "ব্র্যান্ড বাছাই করুন";
  }

  const warrantyMonths = parseInteger(raw.warrantyMonths, 120);
  if (warrantyMonths === null) {
    errors.warrantyMonths = "০ থেকে ১২০ এর মধ্যে সংখ্যা দিন";
  }

  // ছবির লিংক
  const images: string[] = [];
  const rawImages = Array.isArray(raw.images) ? raw.images : [];
  if (rawImages.length > 8) {
    errors.images = "সর্বোচ্চ ৮টা ছবির লিংক দেওয়া যাবে";
  } else {
    for (const item of rawImages) {
      const url = str(item);
      if (!url) continue;
      if (!isHttpsUrl(url)) {
        errors.images =
          "প্রতিটা লিংক https:// দিয়ে শুরু হওয়া সঠিক ঠিকানা হতে হবে (সর্বোচ্চ ৫০০ অক্ষর)";
        break;
      }
      images.push(url);
    }
  }

  // স্পেসিফিকেশন
  const specs: Record<string, string> = {};
  const rawSpecs = Array.isArray(raw.specs) ? raw.specs : [];
  if (rawSpecs.length > 30) {
    errors.specs = "সর্বোচ্চ ৩০টা স্পেসিফিকেশন দেওয়া যাবে";
  } else {
    const seen = new Set<string>();
    for (const row of rawSpecs) {
      const r = isRecord(row) ? row : {};
      const key = str(r.key);
      const value = str(r.value);
      if (!key && !value) continue;

      const lower = key.toLowerCase();
      if (
        !key ||
        !value ||
        key.length > 40 ||
        value.length > 120 ||
        BLOCKED_SPEC_KEYS.includes(lower)
      ) {
        errors.specs =
          "প্রতিটা সারিতে নাম (সর্বোচ্চ ৪০) ও মান (সর্বোচ্চ ১২০) দুটোই লিখুন";
        break;
      }
      if (seen.has(lower)) {
        errors.specs = "একই নাম দুইবার দেওয়া যাবে না";
        break;
      }
      seen.add(lower);
      specs[key] = value;
    }
  }

  // ভ্যারিয়ান্ট
  const variants: VariantInput[] = [];
  const rawVariants = Array.isArray(raw.variants) ? raw.variants : [];
  if (rawVariants.length < 1 || rawVariants.length > 30) {
    errors.variants = "কমপক্ষে ১টা ও সর্বোচ্চ ৩০টা ভ্যারিয়ান্ট দিন";
  } else {
    const seenSku = new Set<string>();

    rawVariants.forEach((row, i) => {
      const r = isRecord(row) ? row : {};
      const p = `variants.${i}.`;

      const idText = str(r.id);
      if (idText.length > 50) errors.variants = "ভ্যারিয়ান্টের তথ্যে সমস্যা আছে";
      const id = idText && idText.length <= 50 ? idText : null;

      const sku = str(r.sku).toUpperCase();
      if (sku.length < 2 || sku.length > 40 || !SKU_PATTERN.test(sku)) {
        errors[p + "sku"] =
          "SKU-তে বড় হাতের ইংরেজি অক্ষর, সংখ্যা ও মাঝে - চলবে (যেমন A55-8-128-BLK)";
      } else if (seenSku.has(sku)) {
        errors[p + "sku"] = "এই SKU একই ফর্মে দুইবার আছে";
      }
      seenSku.add(sku);

      const color = str(r.color);
      if (color.length > 30) errors[p + "color"] = "সর্বোচ্চ ৩০ অক্ষর";

      const storage = str(r.storage);
      if (storage.length > 30) errors[p + "storage"] = "সর্বোচ্চ ৩০ অক্ষর";

      const price = parseMoney(r.price);
      if (price === null || price <= 0) {
        errors[p + "price"] = "সঠিক দাম দিন (দশমিকের পর সর্বোচ্চ ২ অঙ্ক)";
      }

      let comparePrice: number | null = null;
      if (!isBlank(r.comparePrice)) {
        comparePrice = parseMoney(r.comparePrice);
        if (comparePrice === null) {
          errors[p + "comparePrice"] = "সঠিক দাম দিন";
        } else if (price !== null && comparePrice <= price) {
          errors[p + "comparePrice"] = "কাটা দাম বর্তমান দামের চেয়ে বেশি হতে হবে";
        }
      }

      let costPrice: number | null = null;
      if (!isBlank(r.costPrice)) {
        costPrice = parseMoney(r.costPrice);
        if (costPrice === null) errors[p + "costPrice"] = "সঠিক দাম দিন";
      }

      let stock = 0;
      if (id === null) {
        const parsed = parseInteger(r.stock, 100000);
        if (parsed === null) {
          errors[p + "stock"] = "০ থেকে ১,০০,০০০ এর মধ্যে সংখ্যা দিন";
        } else {
          stock = parsed;
        }
      }

      variants.push({
        id,
        sku,
        color: color || null,
        storage: storage || null,
        price: price ?? 0,
        comparePrice,
        costPrice,
        stock,
      });
    });
  }

  if (Object.keys(errors).length > 0 || warrantyMonths === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      slug,
      description,
      model: modelText || null,
      categoryId,
      brandId,
      warrantyMonths,
      isActive: raw.isActive === true,
      isFeatured: raw.isFeatured === true,
      images,
      specs,
      variants,
    },
  };
}