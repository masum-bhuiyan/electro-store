import { prisma } from "@/lib/prisma";

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