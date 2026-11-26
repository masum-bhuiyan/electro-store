"use server";

import { requirePermission } from "@/modules/auth/session";
import { createClosing, type ClosingResult } from "@/modules/closing/mutations";
import { validateClosing } from "@/modules/closing/validation";

export async function saveClosingAction(payload: unknown): Promise<ClosingResult> {
  const staff = await requirePermission("money.manage");

  const checked = validateClosing(payload);
  if (!checked.ok) return { ok: false, message: checked.message };

  return createClosing(checked.data, staff.name);
}