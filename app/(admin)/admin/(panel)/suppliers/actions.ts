"use server";

import { requirePermission } from "@/modules/auth/session";
import {
  createSupplier,
  setSupplierActive,
  updateSupplier,
  type SupplierMutationResult,
} from "@/modules/suppliers/admin-mutations";
import { validateSupplier } from "@/modules/suppliers/validation";

function cleanId(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 && v.length <= 50 ? v : null;
}

export async function createSupplierAction(
  payload: unknown
): Promise<SupplierMutationResult> {
  await requirePermission("purchase.manage");

  const checked = validateSupplier(payload);
  if (!checked.ok) {
    return {
      ok: false,
      message: "ফর্মের লাল ঘরগুলো ঠিক করুন।",
      errors: checked.errors,
    };
  }
  return createSupplier(checked.data);
}

export async function updateSupplierAction(
  id: unknown,
  payload: unknown
): Promise<SupplierMutationResult> {
  await requirePermission("purchase.manage");

  const supplierId = cleanId(id);
  if (!supplierId) {
    return { ok: false, message: "সাপ্লায়ার চেনা যায়নি। পেজ রিফ্রেশ করুন।" };
  }

  const checked = validateSupplier(payload);
  if (!checked.ok) {
    return {
      ok: false,
      message: "ফর্মের লাল ঘরগুলো ঠিক করুন।",
      errors: checked.errors,
    };
  }
  return updateSupplier(supplierId, checked.data);
}

export async function setSupplierActiveAction(
  id: unknown,
  active: unknown
): Promise<{ ok: boolean; message?: string }> {
  await requirePermission("purchase.manage");

  const supplierId = cleanId(id);
  if (!supplierId || typeof active !== "boolean") {
    return { ok: false, message: "অনুরোধে সমস্যা হয়েছে।" };
  }

  const done = await setSupplierActive(supplierId, active);
  return done ? { ok: true } : { ok: false, message: "সাপ্লায়ারকে পাওয়া যায়নি।" };
}