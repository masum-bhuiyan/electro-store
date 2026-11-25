import { prisma } from "@/lib/prisma";
import { makePaymentNumber } from "@/modules/payments/customer-payment";
import type { CashEntryInput } from "./validation";

export type CashResult = { ok: true } | { ok: false; message: string };

class CashError extends Error {}

export async function createCashEntry(
  input: CashEntryInput,
  staffName: string
): Promise<CashResult> {
  try {
    await prisma.$transaction(
      async (tx) => {
        if (input.kind === "OPENING") {
          // একই মাধ্যমে একসাথে দুজন শুরুর জমা বসাতে পারবে না
          const key = `cash-opening-${input.method}`;
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}::text))`;
          const exists = await tx.cashEntry.count({
            where: { kind: "OPENING", method: input.method, voidedAt: null },
          });
          if (exists > 0) {
            throw new CashError(
              "এই মাধ্যমে শুরুর জমা আগেই বসানো আছে। ভুল হলে আগেরটা বাতিল করে আবার বসান।"
            );
          }
        }

        await tx.cashEntry.create({
          data: {
            entryNumber: makePaymentNumber("CSH"),
            kind: input.kind,
            method: input.method,
            amount: input.amount,
            entryDate: input.entryDate,
            note: input.note,
            staffName,
          },
        });
      },
      { maxWait: 5000, timeout: 20000 }
    );
    return { ok: true };
  } catch (e) {
    if (e instanceof CashError) return { ok: false, message: e.message };
    console.error("createCashEntry failed:", e);
    return { ok: false, message: "সেভ করা যায়নি। আবার চেষ্টা করুন।" };
  }
}

// মোছা যায় না, শুধু বাতিল
export async function voidCashEntry(
  id: string,
  reason: string,
  staffName: string
): Promise<CashResult> {
  try {
    const res = await prisma.cashEntry.updateMany({
      where: { id, voidedAt: null },
      data: { voidedAt: new Date(), voidedBy: staffName, voidReason: reason },
    });
    if (res.count !== 1) {
      return { ok: false, message: "এন্ট্রিটা পাওয়া যায়নি বা আগেই বাতিল হয়েছে।" };
    }
    return { ok: true };
  } catch (e) {
    console.error("voidCashEntry failed:", e);
    return { ok: false, message: "বাতিল করা যায়নি। আবার চেষ্টা করুন।" };
  }
}