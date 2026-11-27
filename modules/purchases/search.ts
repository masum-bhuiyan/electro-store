import { prisma } from "@/lib/prisma";
import { variantLabel } from "@/modules/orders/preview-cart";

export type PurchaseSearchRow = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  // গড় কেনা দাম: শুধু costPrice.view থাকলে পাঠানো হয়, নইলে null
  costPrice: number | null;
};

export async function searchPurchaseVariants(
  q: string,
  includeCost: boolean
): Promise<PurchaseSearchRow[]> {
  const term = q.trim().slice(0, 50);
  if (term.length < 2) return [];

  const rows = await prisma.productVariant.findMany({
    where: {
      OR: [
        { sku: { contains: term, mode: "insensitive" } },
        { barcode: { contains: term, mode: "insensitive" } },
        { product: { name: { contains: term, mode: "insensitive" } } },
        { product: { brand: { name: { contains: term, mode: "insensitive" } } } },
      ],
    },
    orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
    take: 8,
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