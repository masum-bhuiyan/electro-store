import { prisma } from "@/lib/prisma";
import { variantLabel } from "@/modules/orders/preview-cart";
import type { PurchaseSearchRow } from "./search";

const MAX_IDS = 20;

// আইডি দিয়ে ভ্যারিয়ান্ট আনে (কম স্টক থেকে ক্রয় ফর্মে পাঠাতে)
export async function getPurchaseVariantsByIds(
  ids: string[],
  includeCost: boolean
): Promise<PurchaseSearchRow[]> {
  const clean = [
    ...new Set(
      ids.filter((x) => typeof x === "string" && x.length > 0 && x.length <= 50)
    ),
  ].slice(0, MAX_IDS);
  if (clean.length === 0) return [];

  const rows = await prisma.productVariant.findMany({
    where: { id: { in: clean }, product: { isActive: true } },
    orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
    include: { product: { select: { name: true } } },
  });

  return rows.map((v) => {
    const label = variantLabel(v);
    return {
      id: v.id,
      name: label ? `${v.product.name} (${label})` : v.product.name,
      sku: v.sku,
      stock: v.stock,
      price: Number(v.price),
      costPrice: includeCost && v.costPrice ? Number(v.costPrice) : null,
    };
  });
}