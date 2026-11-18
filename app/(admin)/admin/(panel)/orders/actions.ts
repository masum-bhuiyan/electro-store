"use server";

import { isOrderStatus } from "@/lib/order-status";
import {
  changeOrderStatus,
  type StatusChangeResult,
} from "@/modules/orders/admin-mutations";
import { requirePermission } from "@/modules/auth/session";

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