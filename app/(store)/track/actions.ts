"use server";

import {
  getOrderForTracking,
  type TrackedOrder,
} from "@/modules/orders/queries";
import {
  normalizeOrderNumber,
  normalizePhone,
} from "@/modules/orders/validation";

export type TrackResult =
  | { ok: true; order: TrackedOrder }
  | { ok: false; message: string };

const NOT_FOUND_MESSAGE =
  "এই অর্ডার নম্বর ও মোবাইল নম্বরের সাথে মেলে এমন কোনো অর্ডার পাওয়া যায়নি। দুটোই আবার দেখে নিন।";

export async function trackOrderAction(payload: unknown): Promise<TrackResult> {
  const p = (
    typeof payload === "object" && payload !== null ? payload : {}
  ) as Record<string, unknown>;

  const orderNumber = normalizeOrderNumber(p.orderNumber);
  if (!orderNumber) {
    return {
      ok: false,
      message: "অর্ডার নম্বরের ফরম্যাট ঠিক নয়। যেমন: ES-261010-K7M3QX",
    };
  }

  const phone = typeof p.phone === "string" ? normalizePhone(p.phone) : null;
  if (!phone) {
    return {
      ok: false,
      message: "সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)",
    };
  }

  try {
    const order = await getOrderForTracking(orderNumber, phone);
    if (!order) return { ok: false, message: NOT_FOUND_MESSAGE };
    return { ok: true, order };
  } catch (e) {
    console.error("trackOrderAction failed:", e);
    return {
      ok: false,
      message: "এই মুহূর্তে অর্ডার খুঁজে পাওয়া যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}