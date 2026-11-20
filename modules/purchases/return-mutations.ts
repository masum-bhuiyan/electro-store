import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { PurchaseReturnInput } from "./return-validation";

export type CreateReturnResult =
  | { ok: true; id: string; returnNumber: string }
  | { ok: false; message: string };

class ReturnError extends Error {}

function makeReturnNumber(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `RET-${yy}${mm}${dd}-${randomInt(100000, 999999)}`;
}

export async function createPurchaseReturn(
  input: PurchaseReturnInput,
  staffName: string
): Promise<CreateReturnResult> {
  const returnNumber = makeReturnNumber();

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        // এই ক্রয়ের সারি লক: একসাথে দুটো ফেরত চললে একটার পর একটা হবে
        await tx.$queryRaw`SELECT id FROM "Purchase" WHERE id = ${input.purchaseId} FOR UPDATE`;

        const purchase = await tx.purchase.findUnique({
          where: { id: input.purchaseId },
          include: { items: true },
        });
        if (!purchase) throw new ReturnError("ক্রয় পাওয়া যায়নি।");

        const already = await tx.purchaseReturnItem.groupBy({
          by: ["purchaseItemId"],
          where: { purchaseItemId: { in: purchase.items.map((i) => i.id) } },
          _sum: { quantity: true },
        });
        const returnedMap = new Map(
          already.map((a) => [a.purchaseItemId, a._sum.quantity ?? 0])
        );
        const itemMap = new Map(purchase.items.map((i) => [i.id, i]));

        let total = new Prisma.Decimal(0);
        const rows: Prisma.PurchaseReturnItemCreateWithoutReturnInput[] = [];

        for (const it of input.items) {
          const pi = itemMap.get(it.purchaseItemId);
          if (!pi) throw new ReturnError("এই ক্রয়ে এমন পণ্য নেই।");

          const available = pi.quantity - (returnedMap.get(pi.id) ?? 0);
          if (it.quantity > available) {
            throw new ReturnError(
              `"${pi.name}": আর সর্বোচ্চ ${available}টি ফেরত দেওয়া যাবে।`
            );
          }

          // স্টক যথেষ্ট থাকলেই কমবে (অনলাইন অর্ডারের সাথে রেস হলেও নিরাপদ)
          const dec = await tx.productVariant.updateMany({
            where: { id: pi.variantId, stock: { gte: it.quantity } },
            data: { stock: { decrement: it.quantity } },
          });
          if (dec.count !== 1) {
            throw new ReturnError(
              `"${pi.name}": স্টকে এতগুলো নেই, ফেরত দেওয়া যাবে না।`
            );
          }

          await tx.stockMovement.create({
            data: {
              variantId: pi.variantId,
              change: -it.quantity,
              reason: "ADJUSTMENT",
              note: `ক্রয় ফেরত ${returnNumber} (${purchase.purchaseNumber}) — ${staffName}`,
            },
          });

          total = total.plus(pi.unitCost.times(it.quantity));
          rows.push({
            purchaseItem: { connect: { id: pi.id } },
            variant: { connect: { id: pi.variantId } },
            name: pi.name,
            quantity: it.quantity,
            unitCost: pi.unitCost,
          });
        }

        if (input.cashReceived.gt(total)) {
          throw new ReturnError("নগদ ফেরত, ফেরতের মূল্যের চেয়ে বেশি হতে পারে না।");
        }

        return tx.purchaseReturn.create({
          data: {
            returnNumber,
            purchase: { connect: { id: purchase.id } },
            supplier: { connect: { id: purchase.supplierId } },
            total,
            cashReceived: input.cashReceived,
            note: input.note,
            staffName,
            items: { create: rows },
          },
          select: { id: true, returnNumber: true },
        });
      },
      { maxWait: 5000, timeout: 20000 }
    );

    return { ok: true, ...created };
  } catch (e) {
    if (e instanceof ReturnError) return { ok: false, message: e.message };
    console.error("createPurchaseReturn failed:", e);
    return {
      ok: false,
      message: "ফেরত সেভ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}