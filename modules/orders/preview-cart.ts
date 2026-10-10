import { prisma } from "@/lib/prisma";
import type { CartLineInput } from "./validation";

export type PreviewLine = {
  variantId: string;
  slug: string;
  name: string;
  variantLabel: string;
  price: number;
  stock: number;
  requested: number;
};

export type CartPreview = {
  lines: PreviewLine[];
  // যেসব ভ্যারিয়ান্ট আর কেনা যায় না (প্রোডাক্ট বন্ধ বা মুছে ফেলা)
  missing: string[];
};

export function variantLabel(v: {
  color: string | null;
  storage: string | null;
  sku: string;
}): string {
  return [v.color, v.storage].filter(Boolean).join(" / ") || v.sku;
}

export async function previewCart(items: CartLineInput[]): Promise<CartPreview> {
  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: items.map((i) => i.variantId) },
      product: { isActive: true },
    },
    include: { product: { select: { name: true, slug: true } } },
  });

  const byId = new Map(variants.map((v) => [v.id, v]));
  const lines: PreviewLine[] = [];
  const missing: string[] = [];

  for (const item of items) {
    const v = byId.get(item.variantId);
    if (!v) {
      missing.push(item.variantId);
      continue;
    }
    lines.push({
      variantId: v.id,
      slug: v.product.slug,
      name: v.product.name,
      variantLabel: variantLabel(v),
      price: Number(v.price),
      stock: v.stock,
      requested: item.quantity,
    });
  }

  return { lines, missing };
}