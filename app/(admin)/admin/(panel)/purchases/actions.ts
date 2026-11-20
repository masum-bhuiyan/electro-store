"use server";

import { requirePermission } from "@/modules/auth/session";
import {
  createPurchase,
  type CreatePurchaseResult,
} from "@/modules/purchases/admin-mutations";
import {
  createPurchaseReturn,
  type CreateReturnResult,
} from "@/modules/purchases/return-mutations";
import { validatePurchaseReturn } from "@/modules/purchases/return-validation";
import {
  searchPurchaseVariants,
  type PurchaseSearchRow,
} from "@/modules/purchases/search";
import { validatePurchase } from "@/modules/purchases/validation";

export async function searchPurchaseProductsAction(
  q: unknown
): Promise<PurchaseSearchRow[]> {
  const staff = await requirePermission("purchase.manage");
  if (typeof q !== "string") return [];
  return searchPurchaseVariants(q, staff.permissions.includes("costPrice.view"));
}

export async function createPurchaseAction(
  payload: unknown
): Promise<CreatePurchaseResult> {
  const staff = await requirePermission("purchase.manage");

  const checked = validatePurchase(payload);
  if (!checked.ok) return { ok: false, message: checked.message };

  return createPurchase(
    checked.data,
    staff.name,
    staff.permissions.includes("products.edit")
  );
}

export async function createPurchaseReturnAction(
  payload: unknown
): Promise<CreateReturnResult> {
  const staff = await requirePermission("purchase.manage");

  const checked = validatePurchaseReturn(payload);
  if (!checked.ok) return { ok: false, message: checked.message };

  return createPurchaseReturn(checked.data, staff.name);
}