import { prisma } from "@/lib/prisma";
import { cache } from "react";

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  categoryName: string;
  image: string | null;
  price: number;
  comparePrice: number | null;
  inStock: boolean;
};

export async function getProducts(): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      brand: true,
      category: true,
      variants: { select: { price: true, comparePrice: true, stock: true } },
    },
  });

  return products.map((p) => {
    // সবচেয়ে কম দামের ভ্যারিয়ান্টটা কার্ডে দেখাব
    const cheapest = [...p.variants].sort(
      (a, b) => Number(a.price) - Number(b.price)
    )[0];

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brandName: p.brand.name,
      categoryName: p.category.name,
      image: p.images[0] ?? null,
      price: cheapest ? Number(cheapest.price) : 0,
      comparePrice: cheapest?.comparePrice ? Number(cheapest.comparePrice) : null,
      inStock: p.variants.some((v) => v.stock > 0),
    };
  });
}
export type ProductVariantItem = {
  id: string;
  sku: string;
  color: string | null;
  storage: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  model: string | null;
  brandName: string;
  categoryName: string;
  images: string[];
  specs: Record<string, string>;
  warrantyMonths: number;
  variants: ProductVariantItem[];
};

// cache() দিয়ে মুড়ে দিলাম, যাতে একই অনুরোধে একই প্রোডাক্ট দুইবার ডাটাবেস থেকে না আনে
export const getProductBySlug = cache(
  async (slug: string): Promise<ProductDetail | null> => {
    const p = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        brand: true,
        category: true,
        variants: { orderBy: { price: "asc" } },
      },
    });

    if (!p) return null;

    // specs ডাটাবেসে JSON আকারে আছে, এখানে সাধারণ "নাম: মান" তালিকায় বদলে নিচ্ছি
    const specs: Record<string, string> = {};
    if (p.specs && typeof p.specs === "object" && !Array.isArray(p.specs)) {
      for (const [key, value] of Object.entries(p.specs)) {
        specs[key] = String(value);
      }
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      model: p.model,
      brandName: p.brand.name,
      categoryName: p.category.name,
      images: p.images,
      specs,
      warrantyMonths: p.warrantyMonths,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        color: v.color,
        storage: v.storage,
        price: Number(v.price),
        comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
        stock: v.stock,
      })),
    };
  }
);