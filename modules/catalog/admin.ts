import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CatalogInput } from "./validation";

export type CatalogKind = "category" | "brand";

export type CatalogItem = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type CatalogResult = { ok: true } | { ok: false; message: string };

export async function getCatalogItems(): Promise<{
  categories: CatalogItem[];
  brands: CatalogItem[];
}> {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
    }),
  ]);

  const shape = (r: (typeof categories)[number]): CatalogItem => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    productCount: r._count.products,
  });

  return { categories: categories.map(shape), brands: brands.map(shape) };
}

export async function createCatalogItem(
  kind: CatalogKind,
  data: CatalogInput
): Promise<CatalogResult> {
  try {
    if (kind === "category") {
      await prisma.category.create({ data: { name: data.name, slug: data.slug } });
    } else {
      await prisma.brand.create({ data: { name: data.name, slug: data.slug } });
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false,
        message: "এই নাম বা slug আগে থেকেই ব্যবহৃত হয়েছে। অন্য কিছু দিন।",
      };
    }
    console.error("createCatalogItem failed:", e);
    return { ok: false, message: "সংরক্ষণ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।" };
  }
}

export async function deleteCatalogItem(
  kind: CatalogKind,
  id: string
): Promise<CatalogResult> {
  const used =
    kind === "category"
      ? await prisma.product.count({ where: { categoryId: id } })
      : await prisma.product.count({ where: { brandId: id } });

  const inUse = (count: number): CatalogResult => ({
    ok: false,
    message: `এতে ${count}টি প্রোডাক্ট আছে, তাই মুছা যাবে না। আগে প্রোডাক্টগুলো অন্য ${
      kind === "category" ? "ক্যাটাগরিতে" : "ব্র্যান্ডে"
    } নিন।`,
  });

  if (used > 0) return inUse(used);

  try {
    if (kind === "category") {
      await prisma.category.delete({ where: { id } });
    } else {
      await prisma.brand.delete({ where: { id } });
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return { ok: false, message: "এটি আগেই মুছে গেছে বা পাওয়া যায়নি।" };
      }
      // গণনার পর কেউ এই ক্যাটাগরি/ব্র্যান্ডে প্রোডাক্ট যোগ করে ফেললে ডাটাবেস নিজেই আটকায়
      if (e.code === "P2003") return inUse(1);
    }
    console.error("deleteCatalogItem failed:", e);
    return { ok: false, message: "মুছা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।" };
  }
}