"use server";

import { isAssignableRole } from "@/lib/permissions";
import { requirePermission } from "@/modules/auth/session";
import {
  changeStaffRole,
  createStaff,
  resetStaffPassword,
  setStaffActive,
  updateStaffAccess,
  type StaffResult,
} from "@/modules/staff/admin";
import {
  validateAccess,
  validateNewStaff,
  validatePassword,
} from "@/modules/staff/validation";

const BAD_REQUEST: StaffResult = { ok: false, message: "অনুরোধে সমস্যা হয়েছে।" };

function validId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 50;
}

export async function createStaffAction(payload: unknown): Promise<StaffResult> {
  await requirePermission("staff.manage");

  const checked = validateNewStaff(payload);
  if (!checked.ok) {
    return {
      ok: false,
      message: "ফর্মের লাল ঘরগুলো ঠিক করুন।",
      errors: checked.errors,
    };
  }
  return createStaff(checked.data);
}

export async function changeStaffRoleAction(
  userId: unknown,
  role: unknown
): Promise<StaffResult> {
  const actor = await requirePermission("staff.manage");
  if (!validId(userId) || !isAssignableRole(role)) return BAD_REQUEST;
  return changeStaffRole(actor.id, userId, role);
}

export async function updateStaffAccessAction(
  userId: unknown,
  permissions: unknown
): Promise<StaffResult> {
  await requirePermission("staff.manage");
  if (!validId(userId)) return BAD_REQUEST;

  const checked = validateAccess(permissions);
  if (!checked.ok) return BAD_REQUEST;
  return updateStaffAccess(userId, checked.permissions);
}

export async function setStaffActiveAction(
  userId: unknown,
  active: unknown
): Promise<StaffResult> {
  const actor = await requirePermission("staff.manage");
  if (!validId(userId) || typeof active !== "boolean") return BAD_REQUEST;
  return setStaffActive(actor.id, userId, active);
}

export async function resetStaffPasswordAction(
  userId: unknown,
  password: unknown
): Promise<StaffResult> {
  await requirePermission("staff.manage");
  if (!validId(userId)) return BAD_REQUEST;

  const pw = validatePassword(password);
  if (!pw.ok) return { ok: false, message: pw.message };
  return resetStaffPassword(userId, pw.value);
}