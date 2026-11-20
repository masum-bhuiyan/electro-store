"use server";

import { requirePermission } from "@/modules/auth/session";
import { createSale, type CreateSaleResult } from "@/modules/sales/create-sale";
import {
  findBelowCost,
  findSaleCustomerByPhone,
  searchSaleCustomers,
  type SaleCustomerRow,
} from "@/modules/sales/search";
import { validateSale } from "@/modules/sales/validation";

export async function searchSaleCustomersAction(
  q: unknown
): Promise<SaleCustomerRow[]> {
  await requirePermission("pos.sell");
  if (typeof q !== "string") return [];
  return searchSaleCustomers(q);
}

export async function lookupSaleCustomerAction(
  phone: unknown
): Promise<SaleCustomerRow | null> {
  await requirePermission("pos.sell");
  if (typeof phone !== "string" || phone.length > 30) return null;
  return findSaleCustomerByPhone(phone);
}

// কোন লাইনে কেনা দামের নিচে বিক্রি হচ্ছে, তার variantId তালিকা
export async function checkBelowCostAction(items: unknown): Promise<string[]> {
  await requirePermission("pos.sell");
  if (!Array.isArray(items) || items.length > 100) return [];

  const clean: { variantId: string; unitPrice: number }[] = [];
  for (const raw of items) {
    const it = (raw ?? {}) as Record<string, unknown>;
    const price = Number(it.unitPrice);
    if (typeof it.variantId === "string" && it.variantId.length <= 50 && price > 0) {
      clean.push({ variantId: it.variantId, unitPrice: price });
    }
  }
  return findBelowCost(clean);
}

export async function createSaleAction(
  payload: unknown
): Promise<CreateSaleResult> {
  const staff = await requirePermission("pos.sell");

  const checked = validateSale(payload);
  if (!checked.ok) return { ok: false, message: checked.message };

  return createSale(
    checked.data,
    staff.name,
    staff.permissions.includes("customers.manage")
  );
}