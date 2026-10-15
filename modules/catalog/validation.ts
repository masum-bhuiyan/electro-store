export type CatalogInput = { name: string; slug: string };

export type CatalogErrors = Partial<Record<"name" | "slug", string>>;

export type CatalogValidation =
  | { ok: true; data: CatalogInput }
  | { ok: false; errors: CatalogErrors };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateCatalogItem(input: unknown): CatalogValidation {
  const raw = (
    typeof input === "object" && input !== null ? input : {}
  ) as Record<string, unknown>;
  const errors: CatalogErrors = {};

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (name.length < 2 || name.length > 60) {
    errors.name = "নাম ২ থেকে ৬০ অক্ষরের মধ্যে লিখুন";
  }

  const slug = typeof raw.slug === "string" ? raw.slug.trim().toLowerCase() : "";
  if (slug.length < 2 || slug.length > 60 || !SLUG_PATTERN.test(slug)) {
    errors.slug =
      "slug-এ শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও মাঝে - চলবে (যেমন smart-watch)";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { name, slug } };
}
