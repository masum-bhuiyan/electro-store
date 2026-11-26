"use server";

import { isOrderStatus } from "@/lib/order-status";
import { requirePermission } from "@/modules/auth/session";
import { editOrder, type EditResult } from "@/modules/orders/admin-edit";
import {
  changeOrderStatus,
  type StatusChangeResult,
} from "@/modules/orders/admin-mutations";
import { validateOrderEdit } from "@/modules/orders/edit-validation";
import { markOrderPaid, type MarkPaidResult } from "@/modules/orders/mark-paid";

export async function changeOrderStatusAction(
  id: unknown,
  status: unknown
): Promise<StatusChangeResult> {
  // UI-তে বাটন লুকালেও এখানে আবার চেক করি: Server Action সরাসরি ডাকা সম্ভব
  await requirePermission("orders.manage");

  const orderId =
    typeof id === "string" && id.length > 0 && id.length <= 50 ? id : null;

  if (!orderId || !isOrderStatus(status)) {
    return { ok: false, message: "অনুরোধে সমস্যা হয়েছে। পেজ রিফ্রেশ করুন।" };
  }

  return changeOrderStatus(orderId, status);
}

export async function editOrderAction(payload: unknown): Promise<EditResult> {
  const staff = await requirePermission("orders.editPrice");

  const checked = validateOrderEdit(payload);
  if (!checked.ok) {
    return {
      ok: false,
      message: checked.errors.form ?? "ফর্মের লাল ঘরগুলো ঠিক করুন।",
      errors: checked.errors,
    };
  }
  return editOrder(checked.data, staff.name);
}

// কুরিয়ার থেকে টাকা হাতে পাওয়ার পর "টাকা পেয়েছি"
export async function markOrderPaidAction(
  id: unknown,
  payload: unknown
): Promise<MarkPaidResult> {
  const staff = await requirePermission("money.manage");
  return markOrderPaid(id, payload, staff.name);
}