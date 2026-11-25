"use server";

import { requirePermission } from "@/modules/auth/session";
import {
  createExpense,
  createExpenseCategory,
  setExpenseCategoryActive,
  voidExpense,
  type ExpenseResult,
} from "@/modules/expenses/mutations";
import { validateCategoryName, validateExpense } from "@/modules/expenses/validation";

export async function createExpenseAction(payload: unknown): Promise<ExpenseResult> {
  const staff = await requirePermission("money.manage");

  const checked = validateExpense(payload);
  if (!checked.ok) return { ok: false, message: checked.message };

  return createExpense(checked.data, staff.name);
}

export async function voidExpenseAction(
  id: unknown,
  reason: unknown
): Promise<ExpenseResult> {
  const staff = await requirePermission("money.manage");
  if (typeof id !== "string" || id.length === 0 || id.length > 50) {
    return { ok: false, message: "খরচ ঠিক নেই।" };
  }
  const why = typeof reason === "string" ? reason.trim().slice(0, 200) : "";
  if (why.length < 3) {
    return { ok: false, message: "বাতিলের কারণ লিখুন (কমপক্ষে ৩ অক্ষর)।" };
  }
  return voidExpense(id, why, staff.name);
}

export async function createExpenseCategoryAction(
  name: unknown
): Promise<ExpenseResult> {
  await requirePermission("money.manage");

  const checked = validateCategoryName(name);
  if (!checked.ok) return { ok: false, message: checked.message };

  return createExpenseCategory(checked.name);
}

export async function setExpenseCategoryActiveAction(
  id: unknown,
  active: unknown
): Promise<ExpenseResult> {
  await requirePermission("money.manage");
  if (typeof id !== "string" || id.length === 0 || id.length > 50) {
    return { ok: false, message: "ক্যাটাগরি ঠিক নেই।" };
  }
  return setExpenseCategoryActive(id, active === true);
}