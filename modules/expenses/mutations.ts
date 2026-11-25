import { prisma } from "@/lib/prisma";
import { makePaymentNumber } from "@/modules/payments/customer-payment";
import type { ExpenseInput } from "./validation";

export type ExpenseResult = { ok: true } | { ok: false; message: string };

export async function createExpense(
  input: ExpenseInput,
  staffName: string
): Promise<ExpenseResult> {
  try {
    const cat = await prisma.expenseCategory.findUnique({
      where: { id: input.categoryId },
      select: { isActive: true },
    });
    if (!cat || !cat.isActive) {
      return { ok: false, message: "এই ক্যাটাগরি পাওয়া যায়নি বা বন্ধ আছে।" };
    }

    if (input.supplierId) {
      const sup = await prisma.supplier.findUnique({
        where: { id: input.supplierId },
        select: { id: true },
      });
      if (!sup) return { ok: false, message: "সাপ্লায়ার পাওয়া যায়নি।" };
    }

    await prisma.expense.create({
      data: {
        expenseNumber: makePaymentNumber("EXP"),
        categoryId: input.categoryId,
        amount: input.amount,
        method: input.method,
        expenseDate: input.expenseDate,
        note: input.note,
        supplierId: input.supplierId,
        staffName,
      },
    });
    return { ok: true };
  } catch (e) {
    console.error("createExpense failed:", e);
    return { ok: false, message: "খরচ সেভ করা যায়নি। আবার চেষ্টা করুন।" };
  }
}

// মোছা যায় না, শুধু বাতিল (মোটে ধরা হয় না)
export async function voidExpense(
  id: string,
  reason: string,
  staffName: string
): Promise<ExpenseResult> {
  try {
    const res = await prisma.expense.updateMany({
      where: { id, voidedAt: null },
      data: { voidedAt: new Date(), voidedBy: staffName, voidReason: reason },
    });
    if (res.count !== 1) {
      return { ok: false, message: "খরচটা পাওয়া যায়নি বা আগেই বাতিল হয়েছে।" };
    }
    return { ok: true };
  } catch (e) {
    console.error("voidExpense failed:", e);
    return { ok: false, message: "বাতিল করা যায়নি। আবার চেষ্টা করুন।" };
  }
}

export async function createExpenseCategory(name: string): Promise<ExpenseResult> {
  try {
    const exists = await prisma.expenseCategory.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
    if (exists) return { ok: false, message: "এই নামে ক্যাটাগরি আগেই আছে।" };

    const max = await prisma.expenseCategory.aggregate({ _max: { sortOrder: true } });
    await prisma.expenseCategory.create({
      data: { name, sortOrder: (max._max.sortOrder ?? 0) + 1 },
    });
    return { ok: true };
  } catch (e) {
    console.error("createExpenseCategory failed:", e);
    return { ok: false, message: "ক্যাটাগরি যোগ করা যায়নি।" };
  }
}

export async function setExpenseCategoryActive(
  id: string,
  active: boolean
): Promise<ExpenseResult> {
  try {
    const res = await prisma.expenseCategory.updateMany({
      where: { id },
      data: { isActive: active },
    });
    if (res.count !== 1) return { ok: false, message: "ক্যাটাগরি পাওয়া যায়নি।" };
    return { ok: true };
  } catch (e) {
    console.error("setExpenseCategoryActive failed:", e);
    return { ok: false, message: "বদলানো যায়নি।" };
  }
}