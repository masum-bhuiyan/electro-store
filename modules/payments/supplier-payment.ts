import { prisma } from "@/lib/prisma";
import { makePaymentNumber, type PaymentResult } from "./customer-payment";
import { getSupplierBalance } from "./supplier-balance";
import type { PaymentInput } from "./validation";

class SupplierPaymentError extends Error {}

export async function paySupplier(
  input: PaymentInput,
  staffName: string
): Promise<PaymentResult> {
  const paymentNumber = makePaymentNumber("PAY");

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        // একসাথে দুজন পেমেন্ট দিলে একজন একজন করে চলবে
        await tx.$queryRaw`SELECT id FROM "Supplier" WHERE id = ${input.partyId} FOR UPDATE`;

        const s = await tx.supplier.findUnique({
          where: { id: input.partyId },
          select: { id: true },
        });
        if (!s) throw new SupplierPaymentError("সাপ্লায়ার পাওয়া যায়নি।");

        const before = await getSupplierBalance(tx, s.id);
        const after = before.minus(input.amount);

        return tx.supplierPayment.create({
          data: {
            paymentNumber,
            supplierId: s.id,
            amount: input.amount,
            method: input.method,
            balanceBefore: before,
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
    if (e instanceof SupplierPaymentError) return { ok: false, message: e.message };
    console.error("paySupplier failed:", e);
    return { ok: false, message: "পেমেন্ট সেভ করা যায়নি। আবার চেষ্টা করুন।" };
  }
}