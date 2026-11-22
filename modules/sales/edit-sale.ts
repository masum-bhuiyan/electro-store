import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { variantLabel } from "@/modules/orders/preview-cart";
import type { CreateSaleResult } from "./create-sale";
import {
  SALE_PAY_LABELS,
  type SalePayMethodKey,
  type SaleInput,
} from "./validation";

class EditError extends Error {}

function t(n: Prisma.Decimal | number): string {
  return `৳${Number(n).toLocaleString("en-US")}`;
}

// কনফার্ম হওয়া বিক্রয়ের সংশোধন। ক্রেতা বদলায় না।
// স্টক শুধু পার্থক্য অনুযায়ী মেলে। যে লাইন বদলায়নি তার আসল দাম ও কেনা দামের snapshot আগেরটাই থাকে
export async function editSale(
  id: string,
  input: SaleInput,
  staffName: string,
  reason: string | null
): Promise<CreateSaleResult> {
  const itemsTotal = input.items.reduce(
    (sum, it) => sum.plus(it.unitPrice.times(it.quantity)),
    new Prisma.Decimal(0)
  );
  const subtotal = itemsTotal.minus(input.extraDiscount);
  const newMap = new Map(input.items.map((i) => [i.variantId, i]));

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Sale" WHERE id = ${id} FOR UPDATE`;

        const sale = await tx.sale.findUnique({
          where: { id },
          include: { items: true },
        });
        if (!sale) throw new EditError("বিক্রয় পাওয়া যায়নি।");
        if (sale.status !== "CONFIRMED") {
          throw new EditError("শুধু কনফার্ম হওয়া বিক্রয় সংশোধন করা যায়।");
        }
        if (!sale.customerId && input.paid.lt(subtotal)) {
          throw new EditError(
            "walk-in ক্রেতার বাকি রাখা যাবে না। পুরো টাকা নিন।"
          );
        }

        const oldMap = new Map(sale.items.map((i) => [i.variantId, i]));
        const allIds = [...new Set([...oldMap.keys(), ...newMap.keys()])].sort(
          (a, b) => a.localeCompare(b)
        );

        const changes: string[] = [];
        const itemRows: Prisma.SaleItemCreateWithoutSaleInput[] = [];

        for (const vid of allIds) {
          const v = await tx.productVariant.findUnique({
            where: { id: vid },
            include: { product: { select: { name: true, isActive: true } } },
          });
          if (!v) throw new EditError("একটি পণ্য পাওয়া যায়নি।");

          const label = variantLabel(v);
          const freshName = label ? `${v.product.name} (${label})` : v.product.name;

          const old = oldMap.get(vid);
          const wanted = newMap.get(vid);
          const delta = (wanted?.quantity ?? 0) - (old?.quantity ?? 0);

          if (delta > 0) {
            if (!v.product.isActive) {
              throw new EditError(`"${freshName}" বন্ধ আছে, বিক্রি করা যাবে না।`);
            }
            const dec = await tx.productVariant.updateMany({
              where: { id: v.id, stock: { gte: delta } },
              data: { stock: { decrement: delta } },
            });
            if (dec.count !== 1) {
              throw new EditError(
                `"${freshName}": আরও ${delta}টি নেওয়ার মতো স্টক নেই (এখন ${v.stock}টি)।`
              );
            }
          } else if (delta < 0) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: { stock: { increment: -delta } },
            });
          }

          if (delta !== 0) {
            await tx.stockMovement.create({
              data: {
                variantId: v.id,
                change: -delta,
                reason: delta > 0 ? "SALE" : "RETURN",
                note: `${sale.saleNumber} (সংশোধন) — ${staffName}`,
              },
            });
          }

          if (!old && wanted) {
            changes.push(`যোগ: ${freshName} × ${wanted.quantity}`);
          } else if (old && !wanted) {
            changes.push(`বাদ: ${old.name} × ${old.quantity}`);
          } else if (old && wanted) {
            if (old.quantity !== wanted.quantity) {
              changes.push(`${old.name}: পরিমাণ ${old.quantity}→${wanted.quantity}`);
            }
            if (!old.unitPrice.equals(wanted.unitPrice)) {
              changes.push(
                `${old.name}: দাম ${t(old.unitPrice)}→${t(wanted.unitPrice)}`
              );
            }
          }

          if (wanted) {
            itemRows.push({
              variant: { connect: { id: v.id } },
              // পুরনো লাইন হলে আগের snapshot-ই থাকে
              name: old ? old.name : freshName,
              quantity: wanted.quantity,
              listPrice: old ? old.listPrice : v.price,
              unitPrice: wanted.unitPrice,
              unitCost: old ? old.unitCost : v.costPrice,
            });
          }
        }

        if (!sale.subtotal.equals(subtotal)) {
          changes.push(`মোট ${t(sale.subtotal)}→${t(subtotal)}`);
        }
        if (!sale.extraDiscount.equals(input.extraDiscount)) {
          changes.push(
            `অতিরিক্ত ছাড় ${t(sale.extraDiscount)}→${t(input.extraDiscount)}`
          );
        }
        if (!sale.paid.equals(input.paid)) {
          changes.push(`পরিশোধ ${t(sale.paid)}→${t(input.paid)}`);
        }
        if (sale.payMethod !== input.payMethod) {
          changes.push(
            `পেমেন্ট ${SALE_PAY_LABELS[sale.payMethod as SalePayMethodKey]}→${
              SALE_PAY_LABELS[input.payMethod]
            }`
          );
        }
        if ((sale.note ?? "") !== (input.note ?? "")) {
          changes.push("নোট বদলেছে");
        }

        if (changes.length === 0) throw new EditError("কিছুই বদলায়নি।");

        await tx.saleEdit.create({
          data: {
            saleId: id,
            staffName,
            summary: changes.join("; ").slice(0, 1000),
            reason,
          },
        });

        await tx.saleItem.deleteMany({ where: { saleId: id } });

        return tx.sale.update({
          where: { id },
          data: {
            subtotal,
            extraDiscount: input.extraDiscount,
            paid: input.paid,
            payMethod: input.payMethod,
            note: input.note,
            items: { create: itemRows },
          },
          select: { id: true, saleNumber: true },
        });
      },
      { maxWait: 5000, timeout: 20000 }
    );

    return { ok: true, ...result };
  } catch (e) {
    if (e instanceof EditError) return { ok: false, message: e.message };
    console.error("editSale failed:", e);
    return { ok: false, message: "সংশোধন করা যায়নি। আবার চেষ্টা করুন।" };
  }
}