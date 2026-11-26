import { prisma } from "@/lib/prisma";
import { makePaymentNumber } from "@/modules/payments/customer-payment";
import type { CashEntryInput } from "./validation";

export type CashResult = { ok: true } | { ok: false; message: string };

class CashError extends Error {}

export const CHARGE_CATEGORY_NAME = "ব্যাংক ও মোবাইল ব্যাংকিং চার্জ";

export async function createCashEntry(
  input: CashEntryInput,
  staffName: string
): Promise<CashResult> {
  const entryNumber = makePaymentNumber("CSH");

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

        // স্থানান্তরে চার্জ থাকলে একটা খরচ নিজে তৈরি হয় (যেখান থেকে টাকা গেল সেই মাধ্যমে)
        let chargeExpenseId: string | null = null;
        if (input.kind === "TRANSFER" && input.charge.gt(0)) {
          const cat = await tx.expenseCategory.upsert({
            where: { name: CHARGE_CATEGORY_NAME },
            update: {},
            create: { name: CHARGE_CATEGORY_NAME, sortOrder: 99 },
            select: { id: true },
          });
          const exp = await tx.expense.create({
            data: {
              expenseNumber: makePaymentNumber("EXP"),
              categoryId: cat.id,
              amount: input.charge,
              method: input.method,
              expenseDate: input.entryDate,
              note: `স্থানান্তরের চার্জ (${entryNumber})`,
              staffName,
            },
            select: { id: true },
          });
          chargeExpenseId = exp.id;
        }

        await tx.cashEntry.create({
          data: {
            entryNumber,
            kind: input.kind,
            method: input.method,
            toMethod: input.kind === "TRANSFER" ? input.toMethod : null,
            amount: input.amount,
            charge: input.kind === "TRANSFER" ? input.charge : 0,
            chargeExpenseId,
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

// মোছা যায় না, শুধু বাতিল। স্থানান্তর বাতিল হলে তার চার্জের খরচও বাতিল হয়
export async function voidCashEntry(
  id: string,
  reason: string,
  staffName: string
): Promise<CashResult> {
  try {
    await prisma.$transaction(
      async (tx) => {
        const entry = await tx.cashEntry.findUnique({
          where: { id },
          select: { chargeExpenseId: true, entryNumber: true },
        });
        const res = await tx.cashEntry.updateMany({
          where: { id, voidedAt: null },
          data: { voidedAt: new Date(), voidedBy: staffName, voidReason: reason },
        });
        if (!entry || res.count !== 1) {
          throw new CashError("এন্ট্রিটা পাওয়া যায়নি বা আগেই বাতিল হয়েছে।");
        }
        if (entry.chargeExpenseId) {
          await tx.expense.updateMany({
            where: { id: entry.chargeExpenseId, voidedAt: null },
            data: {
              voidedAt: new Date(),
              voidedBy: staffName,
              voidReason: `স্থানান্তর ${entry.entryNumber} বাতিল: ${reason}`.slice(0, 200),
            },
          });
        }
      },
      { maxWait: 5000, timeout: 20000 }
    );
    return { ok: true };
  } catch (e) {
    if (e instanceof CashError) return { ok: false, message: e.message };
    console.error("voidCashEntry failed:", e);
    return { ok: false, message: "বাতিল করা যায়নি। আবার চেষ্টা করুন।" };
  }
}