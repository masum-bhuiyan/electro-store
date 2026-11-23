"use server";

import { requirePermission } from "@/modules/auth/session";
import {
  collectCustomerPayment,
  type PaymentResult,
} from "@/modules/payments/customer-payment";
import { paySupplier } from "@/modules/payments/supplier-payment";
import { validatePayment } from "@/modules/payments/validation";

export async function collectCustomerPaymentAction(
  payload: unknown
): Promise<PaymentResult> {
  const staff = await requirePermission("money.manage");

  const checked = validatePayment(payload);
  if (!checked.ok) return { ok: false, message: checked.message };

  return collectCustomerPayment(checked.data, staff.name);
}

export async function paySupplierAction(payload: unknown): Promise<PaymentResult> {
  const staff = await requirePermission("money.manage");

  const checked = validatePayment(payload);
  if (!checked.ok) return { ok: false, message: checked.message };

  return paySupplier(checked.data, staff.name);
}