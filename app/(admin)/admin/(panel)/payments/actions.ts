"use server";

import { requirePermission } from "@/modules/auth/session";
import {
  collectCustomerPayment,
  type PaymentResult,
} from "@/modules/payments/customer-payment";
import {
  setOpeningBalance,
  type OpeningResult,
} from "@/modules/payments/opening-balance";
import { validateOpening } from "@/modules/payments/opening-validation";
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

// ক্রেতা বা সাপ্লায়ারের চালুর সময়ের পুরনো বাকি (একবারই)
export async function setOpeningBalanceAction(
  payload: unknown
): Promise<OpeningResult> {
  const staff = await requirePermission("money.manage");

  const checked = validateOpening(payload);
  if (!checked.ok) return { ok: false, message: checked.message };

  return setOpeningBalance(checked.data, staff.name);
}