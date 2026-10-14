import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const ADMIN_PAGE_SIZE = 20;

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  categoryName: string;
  isActive: boolean;
  isFeatured: boolean;
  variantCount: number;
  totalStock: number;
  minPrice: number;
};

export type AdminProductList = {
  items: AdminProductRow[];
  total: number;
  page: number;
  totalPages: number;
};

export type AdminVariant = {
  id: string;
  sku: string;
  color: string | null;
  storage: string | null;
  price: number;
  comparePrice: number | null;
  costPrice: number | null;
  stock: number;
};

export type AdminProductDetail = {
  id: string;
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
  specs: { key: string; value: string }[];
  variants: AdminVariant[];
};

export type CatalogOptions = {
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
};

export async function getAdminProducts(params: {
  q?: string;
  page?: number;
}): Promise<AdminProductList> {
  const where: Prisma.ProductWhereInput = {};

  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
      { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      variants: { select: { price: true, stock: true } },
    },
  });

  const items = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandName: p.brand.name,
    categoryName: p.category.name,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    variantCount: p.variants.length,
    totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    minPrice:
      p.variants.length > 0
        ? Math.min(...p.variants.map((v) => Number(v.price)))
        : 0,
  }));

  return { items, total, page, totalPages };
}

export async function getAdminProduct(
  id: string
): Promise<AdminProductDetail | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { sku: "asc" } } },
  });

  if (!p) return null;

  const specs: { key: string; value: string }[] = [];
  if (p.specs && typeof p.specs === "object" && !Array.isArray(p.specs)) {
    for (const [key, value] of Object.entries(p.specs)) {
      specs.push({ key, value: String(value) });
    }
  }

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    model: p.model,
    categoryId: p.categoryId,
    brandId: p.brandId,
    warrantyMonths: p.warrantyMonths,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    images: p.images,
    specs,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      color: v.color,
      storage: v.storage,
      price: Number(v.price),
      comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
      costPrice: v.costPrice ? Number(v.costPrice) : null,
      stock: v.stock,
    })),
  };
}

export async function getCatalogOptions(): Promise<CatalogOptions> {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return { categories, brands };
}