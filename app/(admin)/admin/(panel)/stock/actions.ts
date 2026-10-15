"use server";

import { requireAdmin } from "@/modules/auth/session";
import { adjustStock } from "@/modules/inventory/adjust-stock";
import { validateAdjustment } from "@/modules/inventory/validation";

export type AdjustActionResult =
  | { ok: true; newStock: number }
  | { ok: false; message: string; errors?: Record<string, string> };

export async function adjustStockAction(
  payload: unknown
): Promise<AdjustActionResult> {
  const admin = await requireAdmin();

  const checked = validateAdjustment(payload);
  if (!checked.ok) {
    return {
      ok: false,
      message: "ফর্মের লাল ঘরগুলো ঠিক করুন।",
      errors: checked.errors,
    };
  }

  const result = await adjustStock(checked.data, admin.name);
  return result.ok
    ? { ok: true, newStock: result.newStock }
    : { ok: false, message: result.message };
}