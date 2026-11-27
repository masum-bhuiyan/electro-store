import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { dayKey } from "@/modules/cash/book";
import { dhakaToday } from "@/modules/expenses/validation";
import { makePaymentNumber } from "@/modules/payments/customer-payment";
import { SALE_PAY_METHODS } from "@/modules/sales/validation";

export type MarkPaidResult = { ok: true } | { ok: false; message: string };

// transaction-এর ভেতরে throw করলে সব আগের অবস্থায় ফিরে যায়
class PaidError extends Error {}

const COURIER_CATEGORY = "কুরিয়ার ও পরিবহন";
const MAX_EXTRA = 1_000_000;

export async function markOrderPaid(
  id: unknown,
  raw: unknown,
  staffName: string
): Promise<MarkPaidResult> {
  if (typeof id !== "string" || id.length === 0 || id.length > 50) {
    return { ok: false, message: "অনুরোধে সমস্যা হয়েছে। পেজ রিফ্রেশ করুন।" };
  }
  const input = (raw ?? {}) as {
    date?: unknown;
    method?: unknown;
    extra?: unknown;
  };

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

  // বাড়তি চার্জ যাচাই (খালি = ০)
  let extraNum = 0;
  if (input.extra !== undefined && input.extra !== null && input.extra !== "") {
    extraNum = Number(input.extra);
    if (!Number.isFinite(extraNum) || extraNum < 0 || extraNum > MAX_EXTRA) {
      return { ok: false, message: "বাড়তি চার্জের অঙ্ক ঠিকমতো দিন।" };
    }
    extraNum = Math.round(extraNum * 100) / 100;
  }
  const extra = new Prisma.Decimal(extraNum.toFixed(2));

  try {
    await prisma.$transaction(
      async (tx) => {
        // একই অর্ডারে দুইবার "টাকা পেয়েছি" ঠেকাতে সারি লক
        await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${id} FOR UPDATE`;

        const order = await tx.order.findUnique({
          where: { id },
          select: {
            status: true,
            orderNumber: true,
            paymentMethod: true,
            paymentStatus: true,
            subtotal: true,
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
        if (extra.gt(order.subtotal)) {
          throw new PaidError("বাড়তি চার্জ পণ্যের দামের চেয়ে বেশি হতে পারে না।");
        }

        // পাওনা = শুধু পণ্যের দাম। ডেলিভারি চার্জ কুরিয়ারের
        await tx.order.update({
          where: { id },
          data: {
            paymentStatus: "PAID",
            paidAt,
            paidAmount: order.subtotal,
            paidMethod: method as "CASH" | "BKASH" | "NAGAD" | "BANK",
            paidBy: staffName,
            courierExtra: extra.gt(0) ? extra : null,
          },
        });

        // বাড়তি চার্জ থাকলে নিজে একটা খরচ তৈরি
        if (extra.gt(0)) {
          const cat = await tx.expenseCategory.upsert({
            where: { name: COURIER_CATEGORY },
            update: {},
            create: { name: COURIER_CATEGORY, sortOrder: 99 },
            select: { id: true },
          });
          await tx.expense.create({
            data: {
              expenseNumber: makePaymentNumber("EXP"),
              categoryId: cat.id,
              amount: extra,
              method: method as "CASH" | "BKASH" | "NAGAD" | "BANK",
              expenseDate: dayStart,
              note: `কুরিয়ারের বাড়তি চার্জ — ${order.orderNumber}`,
              staffName,
            },
          });
        }
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