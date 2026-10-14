"use server";

import { redirect } from "next/navigation";
import { loginAdmin } from "@/modules/auth/login";
import { destroySession } from "@/modules/auth/session";

export type LoginResult = { ok: true } | { ok: false; message: string };

// সব ব্যর্থতায় একই বার্তা: ইমেইল ভুল না পাসওয়ার্ড ভুল না লক, তা বোঝানো হয় না
const FAIL_MESSAGE =
  "লগইন করা যায়নি। ইমেইল ও পাসওয়ার্ড ঠিক আছে কি না দেখুন। বারবার ভুল হলে কিছুক্ষণের জন্য লগইন বন্ধ থাকবে।";

export async function loginAction(payload: unknown): Promise<LoginResult> {
  const p = (
    typeof payload === "object" && payload !== null ? payload : {}
  ) as Record<string, unknown>;

  const email = typeof p.email === "string" ? p.email.trim().toLowerCase() : "";
  const password = typeof p.password === "string" ? p.password : "";

  if (!email || email.length > 120 || !password || password.length > 200) {
    return { ok: false, message: FAIL_MESSAGE };
  }

  try {
    const ok = await loginAdmin(email, password);
    return ok ? { ok: true } : { ok: false, message: FAIL_MESSAGE };
  } catch (e) {
    console.error("loginAction failed:", e);
    return {
      ok: false,
      message: "এই মুহূর্তে লগইন করা যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}