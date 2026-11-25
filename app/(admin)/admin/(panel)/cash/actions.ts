"use server";

import { requirePermission } from "@/modules/auth/session";
import {
  createCashEntry,
  voidCashEntry,
  type CashResult,
} from "@/modules/cash/mutations";
import { validateCashEntry } from "@/modules/cash/validation";

export async function createCashEntryAction(payload: unknown): Promise<CashResult> {
  const staff = await requirePermission("money.manage");

  const checked = validateCashEntry(payload);
  if (!checked.ok) return { ok: false, message: checked.message };

  return createCashEntry(checked.data, staff.name);
}

export async function voidCashEntryAction(
  id: unknown,
  reason: unknown
): Promise<CashResult> {
  const staff = await requirePermission("money.manage");
  if (typeof id !== "string" || id.length === 0 || id.length > 50) {
    return { ok: false, message: "এন্ট্রি ঠিক নেই।" };
  }
  const why = typeof reason === "string" ? reason.trim().slice(0, 200) : "";
  if (why.length < 3) {
    return { ok: false, message: "বাতিলের কারণ লিখুন (কমপক্ষে ৩ অক্ষর)।" };
  }
  return voidCashEntry(id, why, staff.name);
}