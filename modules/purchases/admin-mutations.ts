import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { MAX_STOCK } from "@/modules/inventory/validation";
import { variantLabel } from "@/modules/orders/preview-cart";
import type { PurchaseInput } from "./validation";

export type CreatePurchaseResult =
  | { ok: true; id: string; purchaseNumber: string }
  | { ok: false; message: string };

// transaction-এর ভেতরে throw করলে সব আগের অবস্থায় ফিরে যায়
class PurchaseError extends Error {}

function makePurchaseNumber(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `PUR-${yy}${mm}${dd}-${randomInt(100000, 999999)}`;
}

export async function createPurchase(
  input: PurchaseInput,
  staffName: string,
  canSetPrice: boolean
): Promise<CreatePurchaseResult> {
  // একই ক্রমে লক নিলে দুই জন একসাথে কাজ করলেও deadlock হয় না
  const items = [...input.items].sort((a, b) =>
    a.variantId.localeCompare(b.variantId)
  );
  const total = items.reduce(
    (sum, it) => sum.plus(it.unitCost.times(it.quantity)),
    new Prisma.Decimal(0)
  );
  const purchaseNumber = makePurchaseNumber();

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        const supplier = await tx.supplier.findUnique({
          where: { id: input.supplierId },
          select: { id: true, name: true, isActive: true },
        });
        if (!supplier) throw new PurchaseError("সাপ্লায়ার পাওয়া যায়নি।");
        if (!supplier.isActive) {
          throw new PurchaseError("এই সাপ্লায়ার বন্ধ আছে।");
        }

        if (input.billNo) {
          const dup = await tx.purchase.findFirst({
            where: {
              supplierId: supplier.id,
              billNo: { equals: input.billNo, mode: "insensitive" },
            },
            select: { purchaseNumber: true },
          });
          if (dup) {
            throw new PurchaseError(
              `এই বিল নম্বর এই সাপ্লায়ারের নামে আগেই আছে (${dup.purchaseNumber})।`
            );
          }
        }

        const itemRows: Prisma.PurchaseItemCreateWithoutPurchaseInput[] = [];

        for (const it of items) {
          // এই ভ্যারিয়ান্টের সারি লক: হিসাবের সময় অন্য কেউ স্টক বদলাতে পারবে না
          await tx.$queryRaw`SELECT id FROM "ProductVariant" WHERE id = ${it.variantId} FOR UPDATE`;

          const v = await tx.productVariant.findUnique({
            where: { id: it.variantId },
            include: { product: { select: { name: true } } },
          });
          if (!v) throw new PurchaseError("একটি পণ্য পাওয়া যায়নি।");

          const label = variantLabel(v);
          const name = label ? `${v.product.name} (${label})` : v.product.name;

          if (v.stock + it.quantity > MAX_STOCK) {
            throw new PurchaseError(
              `"${name}": স্টক সর্বোচ্চ সীমা (১০,০০,০০০) পেরিয়ে যাবে।`
            );
          }

          // গড় কেনা দাম: স্টক না থাকলে বা আগে দাম না থাকলে নতুন দামই
          let avgCost = it.unitCost;
          if (v.stock > 0 && v.costPrice) {
            avgCost = v.costPrice
              .times(v.stock)
              .plus(it.unitCost.times(it.quantity))
              .div(v.stock + it.quantity)
              .toDecimalPlaces(2);
          }

          const priceChanged =
            canSetPrice && it.newPrice !== null && !it.newPrice.equals(v.price);

          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              stock: { increment: it.quantity },
              costPrice: avgCost,
              ...(priceChanged && it.newPrice ? { price: it.newPrice } : {}),
            },
          });

          await tx.stockMovement.create({
            data: {
              variantId: v.id,
              change: it.quantity,
              reason: "PURCHASE",
              note: `${purchaseNumber} — ${supplier.name} — ${staffName}`,
            },
          });

          itemRows.push({
            variant: { connect: { id: v.id } },
            name,
            quantity: it.quantity,
            unitCost: it.unitCost,
            oldPrice: priceChanged ? v.price : null,
            newPrice: priceChanged ? it.newPrice : null,
          });
        }

        return tx.purchase.create({
          data: {
            purchaseNumber,
            supplierId: supplier.id,
            billNo: input.billNo,
            total,
            paid: input.paid,
            note: input.note,
            staffName,
            items: { create: itemRows },
          },
          select: { id: true, purchaseNumber: true },
        });
      },
      { maxWait: 5000, timeout: 20000 }
    );

    return { ok: true, ...created };
  } catch (e) {
    if (e instanceof PurchaseError) {
      return { ok: false, message: e.message };
    }
    console.error("createPurchase failed:", e);
    return {
      ok: false,
      message: "ক্রয় সেভ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}