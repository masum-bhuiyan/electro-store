// ভ্যারিয়ান্টের নাম: "রং / স্টোরেজ", কিছু না থাকলে SKU
export function variantLabel(v: {
  color: string | null;
  storage: string | null;
  sku: string;
}): string {
  return [v.color, v.storage].filter(Boolean).join(" / ") || v.sku;
}