import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type CategoryLink = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type StoreCategory = CategoryLink & { children: CategoryLink[] };

export type CategoryDetail = {
  id: string;
  name: string;
  slug: string;
  parent: { name: string; slug: string } | null;
  children: CategoryLink[];
};

// শুধু চালু প্রোডাক্ট গোনা হয়
const activeCount = { select: { products: { where: { isActive: true } } } };

// হোমপেজের জন্য: প্রধান ক্যাটাগরি, সাব-ক্যাটাগরির প্রোডাক্টসহ গোনা; চালু প্রোডাক্ট না থাকলে বাদ
export const getStoreCategories = cache(async (): Promise<StoreCategory[]> => {
  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      _count: activeCount,
    },
  });

  const link = (r: (typeof rows)[number]): CategoryLink => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    productCount: r._count.products,
  });

  const subs = rows.filter((r) => r.parentId);

  return rows
    .filter((r) => !r.parentId)
    .map((top) => {
      const children = subs
        .filter((s) => s.parentId === top.id)
        .map(link)
        .filter((c) => c.productCount > 0);
      const total =
        top._count.products + children.reduce((sum, c) => sum + c.productCount, 0);
      return { ...link(top), productCount: total, children };
    })
    .filter((c) => c.productCount > 0);
});

// ক্যাটাগরি পেজের জন্য: না পেলে null (পেজ তখন 404 দেখাবে)
export const getCategoryBySlug = cache(
  async (slug: string): Promise<CategoryDetail | null> => {
    const c = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        parent: { select: { name: true, slug: true } },
        children: {
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true, _count: activeCount },
        },
      },
    });
    if (!c) return null;

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      parent: c.parent,
      children: c.children
        .map((ch) => ({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          productCount: ch._count.products,
        }))
        .filter((ch) => ch.productCount > 0),
    };
  }
);