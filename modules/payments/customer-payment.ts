import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCustomerBalance } from "./balance";
import type { PaymentInput } from "./validation";

export type PaymentResult =
  | { ok: true; id: string; paymentNumber: string }
  | { ok: false; message: string };

class PaymentError extends Error {}

export function makePaymentNumber(prefix: string): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${prefix}-${yy}${mm}${dd}-${randomInt(100000, 999999)}`;
}

export async function collectCustomerPayment(
  input: PaymentInput,
  staffName: string
): Promise<PaymentResult> {
  const paymentNumber = makePaymentNumber("COL");

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        // একসাথে দুজন আদায় দিলে একজন একজন করে চলবে
        await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${input.partyId} FOR UPDATE`;

        const c = await tx.customer.findUnique({
          where: { id: input.partyId },
          select: { id: true },
        });
        if (!c) throw new PaymentError("ক্রেতা পাওয়া যায়নি।");

        const bal = await getCustomerBalance(tx, c.id);
        const after = bal.balance.minus(input.amount);

        return tx.customerPayment.create({
          data: {
            paymentNumber,
            customerId: c.id,
            amount: input.amount,
            method: input.method,
            balanceBefore: bal.balance,
            balanceAfter: after,
            note: input.note,
            staffName,
          },
          select: { id: true, paymentNumber: true },
        });
      },
      { maxWait: 5000, timeout: 20000 }
    );
    return { ok: true, ...created };
  } catch (e) {
    if (e instanceof PaymentError) return { ok: false, message: e.message };
    console.error("collectCustomerPayment failed:", e);
    return { ok: false, message: "আদায় সেভ করা যায়নি। আবার চেষ্টা করুন।" };
  }
}