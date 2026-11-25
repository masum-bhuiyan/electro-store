import { prisma } from "@/lib/prisma";
import type { OpeningInput } from "./opening-validation";

export type OpeningResult = { ok: true } | { ok: false; message: string };

class OpeningError extends Error {}

export async function setOpeningBalance(
  input: OpeningInput,
  staffName: string
): Promise<OpeningResult> {
  // বাকি = ধনাত্মক, উল্টো দিক (অগ্রিম) = ঋণাত্মক
  const signed = input.direction === "DUE" ? input.amount : input.amount.negated();

  try {
    await prisma.$transaction(
      async (tx) => {
        if (input.party === "customer") {
          await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${input.partyId} FOR UPDATE`;
          const c = await tx.customer.findUnique({
            where: { id: input.partyId },
            select: { openingSetAt: true },
          });
          if (!c) throw new OpeningError("ক্রেতা পাওয়া যায়নি।");
          if (c.openingSetAt) throw new OpeningError("পুরনো বাকি আগেই বসানো হয়েছে।");
          await tx.customer.update({
            where: { id: input.partyId },
            data: {
              openingBalance: signed,
              openingSetAt: new Date(),
              openingSetBy: staffName,
            },
          });
        } else {
          await tx.$queryRaw`SELECT id FROM "Supplier" WHERE id = ${input.partyId} FOR UPDATE`;
          const s = await tx.supplier.findUnique({
            where: { id: input.partyId },
            select: { openingSetAt: true },
          });
          if (!s) throw new OpeningError("সাপ্লায়ার পাওয়া যায়নি।");
          if (s.openingSetAt) throw new OpeningError("পুরনো বাকি আগেই বসানো হয়েছে।");
          await tx.supplier.update({
            where: { id: input.partyId },
            data: {
              openingBalance: signed,
              openingSetAt: new Date(),
              openingSetBy: staffName,
            },
          });
        }
      },
      { maxWait: 5000, timeout: 20000 }
    );
    return { ok: true };
  } catch (e) {
    if (e instanceof OpeningError) return { ok: false, message: e.message };
    console.error("setOpeningBalance failed:", e);
    return { ok: false, message: "সেভ করা যায়নি। আবার চেষ্টা করুন।" };
  }
}