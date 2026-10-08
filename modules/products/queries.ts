import { prisma } from "@/lib/prisma";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";

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

// প্রতি পেজে কয়টা প্রোডাক্ট দেখাব। এখন পরীক্ষার জন্য ২, দিনের শেষে ১২ করব
export const PAGE_SIZE = 2;

export type ProductFilters = {
  q?: string;
  category?: string;
  brand?: string;
  page?: number;
};

export type ProductListResult = {
  items: ProductListItem[];
  total: number;
  page: number;
  totalPages: number;
};

export async function getProducts(
  filters: ProductFilters = {}
): Promise<ProductListResult> {
  // শুরুতে শর্ত শুধু একটা: প্রোডাক্ট চালু থাকতে হবে
  const where: Prisma.ProductWhereInput = { isActive: true };

  // সার্চ: নাম, মডেল বা ব্র্যান্ডের নামে মিললেই চলবে
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (filters.category) where.category = { slug: filters.category };
  if (filters.brand) where.brand = { slug: filters.brand };

  // পেজ ভাগ: আগে মোট কয়টা মিলল গুনি
  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages);

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      brand: true,
      category: true,
      variants: { select: { price: true, comparePrice: true, stock: true } },
    },
  });

  const items = products.map((p) => {
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

  return { items, total, page, totalPages };
}

// ফিল্টারের ড্রপডাউনে কোন কোন ক্যাটাগরি ও ব্র্যান্ড দেখাব
export async function getFilterOptions() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
  ]);

  return { categories, brands };
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