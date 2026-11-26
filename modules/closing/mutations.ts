import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCashbook } from "@/modules/cash/book";
import { makePaymentNumber } from "@/modules/payments/customer-payment";
import type { ClosingInput } from "./validation";

export type ClosingResult = { ok: true } | { ok: false; message: string };

class ClosingError extends Error {}

export type ClosingLine = {
  method: string;
  label: string;
  started: boolean;
  system: number;
  counted: number;
  diff: number;
  reason: string | null;
};

export async function createClosing(
  input: ClosingInput,
  staffName: string
): Promise<ClosingResult> {
  try {
    // সিস্টেমের হিসাব সার্ভারেই আবার বের করা হয় (ব্রাউজারের সংখ্যা বিশ্বাস করা হয় না)
    const book = await getCashbook(input.date);
    const lines: ClosingLine[] = [];
    let totalDiff = new Prisma.Decimal(0);
    let startedCount = 0;

    for (const card of book.cards) {
      if (card.notStarted) {
        lines.push({
          method: card.method,
          label: card.label,
          started: false,
          system: 0,
          counted: 0,
          diff: 0,
          reason: null,
        });
        continue;
      }
      startedCount++;

      const given = input.lines.find((l) => l.method === card.method);
      if (!given) {
        throw new ClosingError(`"${card.label}"-এর গোনা টাকা লিখুন।`);
      }

      const system = new Prisma.Decimal(card.closing.toFixed(2));
      const diff = given.counted.minus(system);
      if (!diff.equals(0) && (given.reason === null || given.reason.length < 3)) {
        throw new ClosingError(
          `"${card.label}"-এ পার্থক্য আছে, কারণ লিখুন (কমপক্ষে ৩ অক্ষর)।`
        );
      }

      totalDiff = totalDiff.plus(diff);
      lines.push({
        method: card.method,
        label: card.label,
        started: true,
        system: Number(system),
        counted: Number(given.counted),
        diff: Number(diff),
        reason: diff.equals(0) ? null : given.reason,
      });
    }

    if (startedCount === 0) {
      throw new ClosingError("এই তারিখে কোনো মাধ্যমের হিসাব শুরু হয়নি।");
    }

    const closingDate = new Date(`${input.date}T00:00:00+06:00`);

    await prisma.$transaction(
      async (tx) => {
        // একই দিনের সমাপ্তি একসাথে দুজন দিতে পারবে না
        const key = `day-closing-${input.date}`;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}::text))`;

        // আগের সমাপ্তি থাকলে বাতিল (মোছা নয়)
        await tx.dayClosing.updateMany({
          where: { closingDate, voidedAt: null },
          data: {
            voidedAt: new Date(),
            voidedBy: staffName,
            voidReason: "নতুন সমাপ্তি দিয়ে বদলানো হয়েছে",
          },
        });

        await tx.dayClosing.create({
          data: {
            closingNumber: makePaymentNumber("CLS"),
            closingDate,
            lines: lines as unknown as Prisma.InputJsonValue,
            totalDiff,
            staffName,
          },
        });
      },
      { maxWait: 5000, timeout: 20000 }
    );

    return { ok: true };
  } catch (e) {
    if (e instanceof ClosingError) return { ok: false, message: e.message };
    console.error("createClosing failed:", e);
    return { ok: false, message: "সমাপ্তি সেভ করা যায়নি। আবার চেষ্টা করুন।" };
  }
}