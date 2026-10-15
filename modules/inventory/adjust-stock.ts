import { prisma } from "@/lib/prisma";
import { MAX_STOCK, type AdjustInput } from "./validation";

export type AdjustResult =
  | { ok: true; newStock: number }
  | { ok: false; message: string };

// transaction-এর ভেতরে এটা throw করলে সব কিছু আগের অবস্থায় ফিরে যায়
class AdjustError extends Error {}

export async function adjustStock(
  input: AdjustInput,
  byName: string
): Promise<AdjustResult> {
  const { variantId, delta, reason, note } = input;
  const fullNote = note ? `${note} — ${byName}` : `By ${byName}`;

  try {
    const newStock = await prisma.$transaction(
      async (tx) => {
        // কমালে: স্টক যথেষ্ট থাকলেই। বাড়ালে: সর্বোচ্চ সীমা না ছাড়ালেই
        const result = await tx.productVariant.updateMany({
          where:
            delta < 0
              ? { id: variantId, stock: { gte: -delta } }
              : { id: variantId, stock: { lte: MAX_STOCK - delta } },
          data: {
            stock: delta < 0 ? { decrement: -delta } : { increment: delta },
          },
        });

        if (result.count !== 1) {
          const current = await tx.productVariant.findUnique({
            where: { id: variantId },
            select: { stock: true },
          });
          if (!current) throw new AdjustError("ভ্যারিয়ান্টটি পাওয়া যায়নি।");
          throw new AdjustError(
            delta < 0
              ? `বর্তমান স্টক ${current.stock}টি, এর চেয়ে বেশি কমানো যাবে না।`
              : "স্টক সর্বোচ্চ সীমা (১০,০০,০০০) পেরিয়ে যাবে।"
          );
        }

        await tx.stockMovement.create({
          data: { variantId, change: delta, reason, note: fullNote },
        });

        const updated = await tx.productVariant.findUniqueOrThrow({
          where: { id: variantId },
          select: { stock: true },
        });
        return updated.stock;
      },
      { maxWait: 5000, timeout: 15000 }
    );

    return { ok: true, newStock };
  } catch (e) {
    if (e instanceof AdjustError) {
      return { ok: false, message: e.message };
    }
    console.error("adjustStock failed:", e);
    return {
      ok: false,
      message: "স্টক বদলানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}