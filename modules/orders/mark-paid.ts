import { prisma } from "@/lib/prisma";
import { dayKey } from "@/modules/cash/book";
import { dhakaToday } from "@/modules/expenses/validation";
import { SALE_PAY_METHODS } from "@/modules/sales/validation";

export type MarkPaidResult = { ok: true } | { ok: false; message: string };

// transaction-এর ভেতরে throw করলে সব আগের অবস্থায় ফিরে যায়
class PaidError extends Error {}

export async function markOrderPaid(
  id: unknown,
  raw: unknown,
  staffName: string
): Promise<MarkPaidResult> {
  if (typeof id !== "string" || id.length === 0 || id.length > 50) {
    return { ok: false, message: "অনুরোধে সমস্যা হয়েছে। পেজ রিফ্রেশ করুন।" };
  }
  const input = (raw ?? {}) as { date?: unknown; method?: unknown };

  // মাধ্যম যাচাই
  const method =
    typeof input.method === "string" &&
    (SALE_PAY_METHODS as readonly string[]).includes(input.method)
      ? input.method
      : null;
  if (!method) return { ok: false, message: "টাকা পাওয়ার মাধ্যম বেছে নিন।" };

  // তারিখ যাচাই (ঢাকার তারিখ, ভবিষ্যৎ নয়)
  const date = typeof input.date === "string" ? input.date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: "তারিখ ঠিকমতো দিন।" };
  }
  const dayStart = new Date(`${date}T00:00:00+06:00`);
  if (Number.isNaN(dayStart.getTime())) {
    return { ok: false, message: "তারিখ ঠিকমতো দিন।" };
  }
  const today = dhakaToday();
  if (date > today) {
    return { ok: false, message: "ভবিষ্যতের তারিখ দেওয়া যাবে না।" };
  }
  // আজকের তারিখ হলে আসল সময় রাখি (ক্যাশবুকে ক্রম ঠিক থাকে)
  const paidAt = date === today ? new Date() : dayStart;

  try {
    await prisma.$transaction(
      async (tx) => {
        // একই অর্ডারে দুইবার "টাকা পেয়েছি" ঠেকাতে সারি লক
        await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${id} FOR UPDATE`;

        const order = await tx.order.findUnique({
          where: { id },
          select: {
            status: true,
            paymentMethod: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
          },
        });
        if (!order) throw new PaidError("অর্ডারটি পাওয়া যায়নি।");
        if (order.paymentMethod !== "COD") {
          throw new PaidError("এটা ক্যাশ অন ডেলিভারি অর্ডার নয়।");
        }
        if (order.status !== "DELIVERED") {
          throw new PaidError(
            "অর্ডার DELIVERED না হলে টাকা পাওয়া লেখা যায় না। পেজ রিফ্রেশ করুন।"
          );
        }
        if (order.paymentStatus === "PAID") {
          throw new PaidError("এই অর্ডারের টাকা আগেই পাওয়া লেখা হয়েছে।");
        }
        if (date < dayKey(order.createdAt)) {
          throw new PaidError("অর্ডারের তারিখের আগের তারিখ দেওয়া যাবে না।");
        }

        await tx.order.update({
          where: { id },
          data: {
            paymentStatus: "PAID",
            paidAt,
            paidAmount: order.total,
            paidMethod: method as "CASH" | "BKASH" | "NAGAD" | "BANK",
            paidBy: staffName,
          },
        });
      },
      { maxWait: 5000, timeout: 15000 }
    );
    return { ok: true };
  } catch (e) {
    if (e instanceof PaidError) return { ok: false, message: e.message };
    console.error("markOrderPaid failed:", e);
    return {
      ok: false,
      message: "সেভ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}