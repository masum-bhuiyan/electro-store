import { prisma } from "@/lib/prisma";
import { addDays } from "@/modules/cash/book";
import { dhakaToday } from "@/modules/expenses/validation";

// ড্রাফট কয়টা অপেক্ষায় আছে ও সবচেয়ে পুরনোটা কত দিনের
export async function getDraftSummary(): Promise<{
  count: number;
  oldestDays: number;
}> {
  const [count, oldest] = await Promise.all([
    prisma.sale.count({ where: { status: "DRAFT" } }),
    prisma.sale.findFirst({
      where: { status: "DRAFT" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);
  const oldestDays = oldest
    ? Math.max(0, Math.floor((Date.now() - oldest.createdAt.getTime()) / 86_400_000))
    : 0;
  return { count, oldestDays };
}

// আজকের খরচ (বাতিল বাদে)
export async function getTodayExpenseTotal(): Promise<number> {
  const today = dhakaToday();
  const start = new Date(`${today}T00:00:00+06:00`);
  const end = new Date(`${addDays(today, 1)}T00:00:00+06:00`);
  const agg = await prisma.expense.aggregate({
    where: { voidedAt: null, expenseDate: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return Math.round(Number(agg._sum.amount ?? 0) * 100) / 100;
}