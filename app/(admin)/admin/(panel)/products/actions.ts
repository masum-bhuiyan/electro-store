"use server";

import { requirePermission } from "@/modules/auth/session";
import {
  createProduct,
  setProductActive,
  updateProduct,
  type MutationResult,
} from "@/modules/products/admin-mutations";
import { validateProduct } from "@/modules/products/validation";

function cleanId(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 && v.length <= 50 ? v : null;
}

export async function createProductAction(
  payload: unknown
): Promise<MutationResult> {
  const staff = await requirePermission("products.edit");
  const canSetCost = staff.permissions.includes("costPrice.view");

  const checked = validateProduct(payload);
  if (!checked.ok) {
    return {
      ok: false,
      message: "ফর্মের লাল ঘরগুলো ঠিক করুন।",
      errors: checked.errors,
    };
  }

  // কেনা দাম দেওয়ার অনুমতি না থাকলে ব্রাউজার যা-ই পাঠাক, খালি রাখি
  const data = canSetCost
    ? checked.data
    : {
        ...checked.data,
        variants: checked.data.variants.map((v) => ({ ...v, costPrice: null })),
      };

  return createProduct(data);
}

export async function updateProductAction(
  id: unknown,
  payload: unknown
): Promise<MutationResult> {
  const staff = await requirePermission("products.edit");
  const canSetCost = staff.permissions.includes("costPrice.view");

  const productId = cleanId(id);
  if (!productId) {
    return { ok: false, message: "প্রোডাক্ট চেনা যায়নি। পেজ রিফ্রেশ করুন।" };
  }

  const checked = validateProduct(payload);
  if (!checked.ok) {
    return {
      ok: false,
      message: "ফর্মের লাল ঘরগুলো ঠিক করুন।",
      errors: checked.errors,
    };
  }
  return updateProduct(productId, checked.data, canSetCost);
}

export async function setProductActiveAction(
  id: unknown,
  active: unknown
): Promise<{ ok: boolean; message?: string }> {
  await requirePermission("products.edit");

  const productId = cleanId(id);
  if (!productId || typeof active !== "boolean") {
    return { ok: false, message: "অনুরোধে সমস্যা হয়েছে।" };
  }

  const done = await setProductActive(productId, active);
  return done ? { ok: true } : { ok: false, message: "প্রোডাক্টটি পাওয়া যায়নি।" };
}