import type { Prisma } from "@/generated/prisma/client";
import type { StockReasonKey } from "@/lib/stock";
import { prisma } from "@/lib/prisma";
import { LOW_STOCK_LIMIT } from "@/modules/admin/stats";
import { variantLabel } from "@/modules/orders/preview-cart";

export const STOCK_PAGE_SIZE = 25;

export type StockRow = {
  id: string;
  sku: string;
  label: string;
  productName: string;
  productActive: boolean;
  stock: number;
};

export type StockList = {
  items: StockRow[];
  total: number;
  page: number;
  totalPages: number;
};

export type StockDetail = {
  id: string;
  sku: string;
  label: string;
  stock: number;
  productId: string;
  productName: string;
  productActive: boolean;
  movements: {
    change: number;
    reason: StockReasonKey;
    note: string | null;
    createdAt: string;
  }[];
};

export async function getStockList(params: {
  q?: string;
  lowOnly?: boolean;
  page?: number;
}): Promise<StockList> {
  const and: Prisma.ProductVariantWhereInput[] = [];

  const term = params.q?.trim().slice(0, 50);
  if (term) {
    and.push({
      OR: [
        { sku: { contains: term, mode: "insensitive" } },
        { product: { name: { contains: term, mode: "insensitive" } } },
        { product: { brand: { name: { contains: term, mode: "insensitive" } } } },
      ],
    });
  }

  if (params.lowOnly) {
    and.push({
      stock: { lte: LOW_STOCK_LIMIT },
      product: { isActive: true },
    });
  }

  const where: Prisma.ProductVariantWhereInput = and.length > 0 ? { AND: and } : {};

  const total = await prisma.productVariant.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / STOCK_PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);

  const variants = await prisma.productVariant.findMany({
    where,
    orderBy: [{ stock: "asc" }, { sku: "asc" }],
    skip: (page - 1) * STOCK_PAGE_SIZE,
    take: STOCK_PAGE_SIZE,
    include: { product: { select: { name: true, isActive: true } } },
  });

  const items: StockRow[] = variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    label: variantLabel(v),
    productName: v.product.name,
    productActive: v.product.isActive,
    stock: v.stock,
  }));

  return { items, total, page, totalPages };
}

export async function getStockDetail(id: string): Promise<StockDetail | null> {
  const v = await prisma.productVariant.findUnique({
    where: { id },
    include: { product: { select: { id: true, name: true, isActive: true } } },
  });
  if (!v) return null;

  const movements = await prisma.stockMovement.findMany({
    where: { variantId: id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 20,
    select: { change: true, reason: true, note: true, createdAt: true },
  });

  return {
    id: v.id,
    sku: v.sku,
    label: variantLabel(v),
    stock: v.stock,
    productId: v.product.id,
    productName: v.product.name,
    productActive: v.product.isActive,
    movements: movements.map((m) => ({
      change: m.change,
      reason: m.reason,
      note: m.note,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}