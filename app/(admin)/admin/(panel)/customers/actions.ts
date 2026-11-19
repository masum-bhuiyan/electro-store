"use server";

import { requirePermission } from "@/modules/auth/session";
import {
  createCustomer,
  setCustomerActive,
  updateCustomer,
  type CustomerMutationResult,
} from "@/modules/customers/admin-mutations";
import { validateCustomer } from "@/modules/customers/validation";
import { prisma } from "@/lib/prisma";

function cleanId(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 && v.length <= 50 ? v : null;
}

export async function createCustomerAction(
  payload: unknown
): Promise<CustomerMutationResult> {
  await requirePermission("customers.manage");

  const checked = validateCustomer(payload);
  if (!checked.ok) {
    return {
      ok: false,
      message: "ফর্মের লাল ঘরগুলো ঠিক করুন।",
      errors: checked.errors,
    };
  }
  return createCustomer(checked.data);
}

export async function updateCustomerAction(
  id: unknown,
  payload: unknown
): Promise<CustomerMutationResult> {
  await requirePermission("customers.manage");

  const customerId = cleanId(id);
  if (!customerId) {
    return { ok: false, message: "ক্রেতা চেনা যায়নি। পেজ রিফ্রেশ করুন।" };
  }

  const checked = validateCustomer(payload);
  if (!checked.ok) {
    return {
      ok: false,
      message: "ফর্মের লাল ঘরগুলো ঠিক করুন।",
      errors: checked.errors,
    };
  }
  return updateCustomer(customerId, checked.data);
}

export async function setCustomerActiveAction(
  id: unknown,
  active: unknown
): Promise<{ ok: boolean; message?: string }> {
  await requirePermission("customers.manage");

  const customerId = cleanId(id);
  if (!customerId || typeof active !== "boolean") {
    return { ok: false, message: "অনুরোধে সমস্যা হয়েছে।" };
  }

  const done = await setCustomerActive(customerId, active);
  return done ? { ok: true } : { ok: false, message: "ক্রেতাকে পাওয়া যায়নি।" };
}
// অর্ডার পেজ থেকে এক ক্লিকে ক্রেতা বানানো (খুচরা ধরে, অর্ডারের নাম ও ফোন দিয়ে)
export async function createCustomerFromOrderAction(
  orderId: unknown
): Promise<CustomerMutationResult> {
  await requirePermission("customers.manage");

  const id = cleanId(orderId);
  if (!id) return { ok: false, message: "অর্ডার চেনা যায়নি।" };

  const order = await prisma.order.findUnique({
    where: { id },
    select: { customerName: true, phone: true },
  });
  if (!order) return { ok: false, message: "অর্ডারটি পাওয়া যায়নি।" };

  const checked = validateCustomer({
    type: "RETAIL",
    name: order.customerName,
    phone: order.phone,
  });
  if (!checked.ok) {
    return {
      ok: false,
      message: "অর্ডারের নাম বা ফোনে সমস্যা, হাতে ক্রেতা বানান।",
    };
  }
  return createCustomer(checked.data);
}