import { prisma } from "@/lib/prisma";

export type DashboardStats = {
  pendingOrders: number;
  totalOrders: number;
  activeProducts: number;
  lowStockVariants: number;
};

// স্টক এই সংখ্যা বা কমে গেলে "কম স্টক" ধরব
export const LOW_STOCK_LIMIT = 5;

export async function getDashboardStats(): Promise<DashboardStats> {
  const [pendingOrders, totalOrders, activeProducts, lowStockVariants] =
    await Promise.all([
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.productVariant.count({
        where: { stock: { lte: LOW_STOCK_LIMIT }, product: { isActive: true } },
      }),
    ]);

  return { pendingOrders, totalOrders, activeProducts, lowStockVariants };
}