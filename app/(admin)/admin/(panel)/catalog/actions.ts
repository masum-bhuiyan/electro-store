"use server";

import { requireAdmin } from "@/modules/auth/session";
import {
  createCatalogItem,
  deleteCatalogItem,
  type CatalogKind,
  type CatalogResult,
} from "@/modules/catalog/admin";
import { validateCatalogItem } from "@/modules/catalog/validation";

function isKind(v: unknown): v is CatalogKind {
  return v === "category" || v === "brand";
}

export type CatalogActionResult =
  | { ok: true }
  | { ok: false; message: string; errors?: Record<string, string> };

export async function createCatalogItemAction(
  kind: unknown,
  payload: unknown
): Promise<CatalogActionResult> {
  await requireAdmin();

  if (!isKind(kind)) return { ok: false, message: "অনুরোধে সমস্যা হয়েছে।" };

  const checked = validateCatalogItem(payload);
  if (!checked.ok) {
    return {
      ok: false,
      message: "ফর্মের লাল ঘরগুলো ঠিক করুন।",
      errors: checked.errors,
    };
  }
  return createCatalogItem(kind, checked.data);
}

export async function deleteCatalogItemAction(
  kind: unknown,
  id: unknown
): Promise<CatalogResult> {
  await requireAdmin();

  if (!isKind(kind) || typeof id !== "string" || !id || id.length > 50) {
    return { ok: false, message: "অনুরোধে সমস্যা হয়েছে।" };
  }
  return deleteCatalogItem(kind, id);
}