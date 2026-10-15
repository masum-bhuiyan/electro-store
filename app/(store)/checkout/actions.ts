"use server";

import { createOrder } from "@/modules/orders/create-order";
import { previewCart, type CartPreview } from "@/modules/orders/preview-cart";
import {
  normalizeItems,
  validateCustomer,
  type FieldErrors,
} from "@/modules/orders/validation";

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; total: number }
  | {
      ok: false;
      code: "INVALID_INPUT";
      message: string;
      fieldErrors: FieldErrors;
    }
  | {
      ok: false;
            code:
        | "UNAVAILABLE"
        | "OUT_OF_STOCK"
        | "PRICE_CHANGED"
        | "RATE_LIMITED"
        | "SERVER_ERROR";
      message: string;
    };

// চেকআউট পেজ খুললে কার্টের আসল দাম ও স্টক জানার জন্য
export async function previewCartAction(
  rawItems: unknown
): Promise<CartPreview | null> {
  const items = normalizeItems(rawItems);
  if (!items) return null;
  return previewCart(items);
}

function invalid(message: string, fieldErrors: FieldErrors = {}): PlaceOrderResult {
  return { ok: false, code: "INVALID_INPUT", message, fieldErrors };
}

export async function placeOrderAction(payload: unknown): Promise<PlaceOrderResult> {
  const p = (
    typeof payload === "object" && payload !== null ? payload : {}
  ) as Record<string, unknown>;

  const items = normalizeItems(p.items);
  if (!items) {
    return invalid("কার্টে সমস্যা আছে। কার্ট পেজে ফিরে আবার চেষ্টা করুন।");
  }

  const customer = validateCustomer(p.customer);
  if (!customer.ok) {
    return invalid("ফর্মের লাল চিহ্নিত ঘরগুলো ঠিক করুন।", customer.errors);
  }

  const key = p.idempotencyKey;
  if (typeof key !== "string" || !/^[A-Za-z0-9-]{8,64}$/.test(key)) {
    return invalid("অনুরোধে সমস্যা হয়েছে। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।");
  }

  const expected = p.expectedSubtotal;
  if (typeof expected !== "number" || !Number.isFinite(expected)) {
    return invalid("অনুরোধে সমস্যা হয়েছে। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।");
  }

  return createOrder({
    customer: customer.data,
    items,
    expectedSubtotal: expected,
    idempotencyKey: key,
  });
}