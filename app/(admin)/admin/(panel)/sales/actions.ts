"use server";

import { requirePermission } from "@/modules/auth/session";
import { createSale, type CreateSaleResult } from "@/modules/sales/create-sale";
import {
  confirmDraft,
  deleteDraft,
  type DraftResult,
} from "@/modules/sales/draft-mutations";
import { updateDraft } from "@/modules/sales/draft-update";
import { editSale } from "@/modules/sales/edit-sale";
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

  const checked = validateSale(payload, "CONFIRMED");
  if (!checked.ok) return { ok: false, message: checked.message };

  return createSale(
    checked.data,
    staff.name,
    staff.permissions.includes("customers.manage")
  );
}

export async function saveDraftAction(
  payload: unknown
): Promise<CreateSaleResult> {
  const staff = await requirePermission("pos.sell");

  const checked = validateSale(payload, "DRAFT");
  if (!checked.ok) return { ok: false, message: checked.message };

  return createSale(
    checked.data,
    staff.name,
    staff.permissions.includes("customers.manage")
  );
}

export async function deleteDraftAction(id: unknown): Promise<DraftResult> {
  const staff = await requirePermission("pos.sell");
  if (typeof id !== "string" || id.length === 0 || id.length > 50) {
    return { ok: false, message: "ড্রাফট ঠিক নেই।" };
  }
  return deleteDraft(id, staff.name);
}

export async function confirmDraftAction(id: unknown): Promise<DraftResult> {
  await requirePermission("pos.sell");
  if (typeof id !== "string" || id.length === 0 || id.length > 50) {
    return { ok: false, message: "ড্রাফট ঠিক নেই।" };
  }
  return confirmDraft(id);
}
// ড্রাফট এডিট। confirm = true হলে আপডেটের সাথে কনফার্মও
export async function updateDraftAction(
  id: unknown,
  payload: unknown,
  confirm: unknown
): Promise<CreateSaleResult> {
  const staff = await requirePermission("pos.sell");
  if (typeof id !== "string" || id.length === 0 || id.length > 50) {
    return { ok: false, message: "ড্রাফট ঠিক নেই।" };
  }

  const checked = validateSale(payload, confirm === true ? "CONFIRMED" : "DRAFT");
  if (!checked.ok) return { ok: false, message: checked.message };

  return updateDraft(
    id,
    checked.data,
    staff.name,
    staff.permissions.includes("customers.manage")
  );
}
// কনফার্ম হওয়া বিক্রয়ের সংশোধন (sales.edit লাগবে)
export async function editSaleAction(
  id: unknown,
  payload: unknown,
  reason: unknown
): Promise<CreateSaleResult> {
  await requirePermission("pos.sell");
  const staff = await requirePermission("sales.edit");
  if (typeof id !== "string" || id.length === 0 || id.length > 50) {
    return { ok: false, message: "বিক্রয় ঠিক নেই।" };
  }

  const checked = validateSale(payload, "CONFIRMED");
  if (!checked.ok) return { ok: false, message: checked.message };

  const why = typeof reason === "string" ? reason.trim().slice(0, 200) : "";
  return editSale(id, checked.data, staff.name, why === "" ? null : why);
}