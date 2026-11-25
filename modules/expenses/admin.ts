import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { SALE_PAY_LABELS, type SalePayMethodKey } from "@/modules/sales/validation";

export const EXPENSES_PAGE_SIZE = 20;

const DEFAULT_CATEGORIES = [
  "দোকান ভাড়া",
  "কর্মচারীর বেতন",
  "বিদ্যুৎ বিল",
  "ইন্টারনেট ও মোবাইল বিল",
  "কুরিয়ার ও পরিবহন",
  "ক্রয় সংক্রান্ত খরচ",
  "চা-নাস্তা ও আপ্যায়ন",
  "মেরামত ও রক্ষণাবেক্ষণ",
  "বিজ্ঞাপন ও মার্কেটিং",
  "প্যাকেজিং",
  "অফিস সামগ্রী",
  "বিবিধ",
];

export type ExpenseCategoryRow = { id: string; name: string; isActive: boolean };

// ক্যাটাগরি একটাও না থাকলে প্রাথমিক তালিকা বানিয়ে দেয়
export async function getExpenseCategories(): Promise<ExpenseCategoryRow[]> {
  const count = await prisma.expenseCategory.count();
  if (count === 0) {
    await prisma.expenseCategory.createMany({
      data: DEFAULT_CATEGORIES.map((name, i) => ({ name, sortOrder: i + 1 })),
      skipDuplicates: true,
    });
  }
  return prisma.expenseCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, isActive: true },
  });
}

export async function getExpenseSupplierOptions(): Promise<
  { id: string; name: string }[]
> {
  return prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    take: 500,
    select: { id: true, name: true },
  });
}

export type ExpenseRow = {
  id: string;
  expenseNumber: string;
  expenseDate: string;
  categoryName: string;
  amount: number;
  methodLabel: string;
  note: string | null;
  supplierName: string | null;
  staffName: string;
  voided: boolean;
  voidReason: string | null;
  voidedBy: string | null;
};

export type ExpenseList = {
  items: ExpenseRow[];
  total: number;
  page: number;
  totalPages: number;
  monthTotal: number;
  byCategory: { name: string; amount: number }[];
};

function monthRange(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: new Date(`${y}-${pad(m)}-01T00:00:00+06:00`),
    end: new Date(`${ny}-${pad(nm)}-01T00:00:00+06:00`),
  };
}

export async function getAdminExpenses(params: {
  month: string;
  categoryId?: string;
  page?: number;
}): Promise<ExpenseList> {
  const { start, end } = monthRange(params.month);
  const monthWhere: Prisma.ExpenseWhereInput = {
    expenseDate: { gte: start, lt: end },
  };
  const where: Prisma.ExpenseWhereInput = { ...monthWhere };
  if (params.categoryId) where.categoryId = params.categoryId;

  const total = await prisma.expense.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / EXPENSES_PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);

  const [rows, groups, cats] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * EXPENSES_PAGE_SIZE,
      take: EXPENSES_PAGE_SIZE,
      include: {
        category: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { ...monthWhere, voidedAt: null },
      _sum: { amount: true },
    }),
    prisma.expenseCategory.findMany({ select: { id: true, name: true } }),
  ]);

  const nameOf = new Map(cats.map((c) => [c.id, c.name]));
  const byCategory = groups
    .map((g) => ({
      name: nameOf.get(g.categoryId) ?? "—",
      amount: Number(g._sum.amount ?? 0),
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    items: rows.map((e) => ({
      id: e.id,
      expenseNumber: e.expenseNumber,
      expenseDate: e.expenseDate.toISOString(),
      categoryName: e.category.name,
      amount: Number(e.amount),
      methodLabel: SALE_PAY_LABELS[e.method as SalePayMethodKey] ?? e.method,
      note: e.note,
      supplierName: e.supplier?.name ?? null,
      staffName: e.staffName,
      voided: e.voidedAt !== null,
      voidReason: e.voidReason,
      voidedBy: e.voidedBy,
    })),
    total,
    page,
    totalPages,
    monthTotal: Math.round(byCategory.reduce((s, c) => s + c.amount, 0) * 100) / 100,
    byCategory,
  };
}