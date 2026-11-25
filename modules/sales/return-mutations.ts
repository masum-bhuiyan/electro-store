import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCustomerBalance } from "@/modules/payments/balance";
import { makePaymentNumber } from "@/modules/payments/customer-payment";
import type { SaleReturnInput } from "./return-validation";

export type SaleReturnResult =
  | {
      ok: true;
      id: string;
      returnNumber: string;
      total: number;
      creditAmount: number;
      cashRefund: number;
    }
  | { ok: false; message: string };

class SaleReturnError extends Error {}

export async function createSaleReturn(
  input: SaleReturnInput,
  staffName: string
): Promise<SaleReturnResult> {
  const returnNumber = makePaymentNumber("SRT");
  const zero = new Prisma.Decimal(0);

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        // একই বিলে দুজন একসাথে ফেরত নিলে একজন একজন করে চলবে
        await tx.$queryRaw`SELECT id FROM "Sale" WHERE id = ${input.saleId} FOR UPDATE`;

        const sale = await tx.sale.findUnique({
          where: { id: input.saleId },
          include: { items: { orderBy: { id: "asc" } } },
        });
        if (!sale) throw new SaleReturnError("বিক্রয় পাওয়া যায়নি।");
        if (sale.status !== "CONFIRMED") {
          throw new SaleReturnError("শুধু কনফার্ম হওয়া বিক্রয় থেকে ফেরত নেওয়া যায়।");
        }

        // আগে কোন লাইনে কত ফেরত হয়েছে
        const prior = await tx.saleReturnItem.groupBy({
          by: ["saleItemId"],
          where: { saleItem: { saleId: sale.id } },
          _sum: { quantity: true },
        });
        const returnedMap = new Map<string, number>(
          prior.map((p) => [p.saleItemId, p._sum.quantity ?? 0])
        );
        const priorTotalAgg = await tx.saleReturn.aggregate({
          where: { saleId: sale.id },
          _sum: { total: true },
        });
        const priorTotal = priorTotalAgg._sum.total ?? zero;

        // অতিরিক্ত ছাড় থাকলে ফেরতের মূল্যও সেই অনুপাতে কমবে
        const itemsTotal = sale.items.reduce(
          (sum, i) => sum.plus(i.unitPrice.times(i.quantity)),
          zero
        );
        const ratio = itemsTotal.gt(0)
          ? sale.subtotal.div(itemsTotal)
          : new Prisma.Decimal(1);

        const itemMap = new Map(sale.items.map((i) => [i.id, i]));
        const lines: {
          saleItemId: string;
          variantId: string;
          name: string;
          quantity: number;
          unitPrice: Prisma.Decimal;
          unitCost: Prisma.Decimal | null;
          amount: Prisma.Decimal;
        }[] = [];

        for (const req of input.items) {
          const si = itemMap.get(req.saleItemId);
          if (!si) throw new SaleReturnError("এই বিক্রয়ে এমন পণ্য নেই।");
          const available = si.quantity - (returnedMap.get(si.id) ?? 0);
          if (req.quantity > available) {
            throw new SaleReturnError(
              `"${si.name}": আর সর্বোচ্চ ${available}টি ফেরত নেওয়া যাবে।`
            );
          }
          lines.push({
            saleItemId: si.id,
            variantId: si.variantId,
            name: si.name,
            quantity: req.quantity,
            unitPrice: si.unitPrice,
            unitCost: si.unitCost,
            amount: si.unitPrice.times(req.quantity).times(ratio).toDecimalPlaces(2),
          });
        }

        // সব বাকি মাল ফেরত হলে মোট ঠিক "বিলের মোট − আগের ফেরত" হবে (পয়সার গোল মেলাতে)
        const takesEverything = sale.items.every((si) => {
          const avail = si.quantity - (returnedMap.get(si.id) ?? 0);
          if (avail === 0) return true;
          return lines.find((l) => l.saleItemId === si.id)?.quantity === avail;
        });
        if (takesEverything) {
          const remaining = sale.subtotal.minus(priorTotal);
          const sum = lines.reduce((s, l) => s.plus(l.amount), zero);
          const last = lines[lines.length - 1];
          last.amount = last.amount.plus(remaining.minus(sum));
        }

        const total = lines.reduce((s, l) => s.plus(l.amount), zero);
        if (total.lte(0)) {
          throw new SaleReturnError("ফেরতের মূল্য ০ হয়ে যাচ্ছে।");
        }

        // টাকার ভাগ: বাকি থাকলে আগে সেখান থেকে কাটা, বাকিটা নগদ ফেরত
        let creditAmount = zero;
        if (sale.customerId) {
          await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${sale.customerId} FOR UPDATE`;
          const bal = await getCustomerBalance(tx, sale.customerId);
          if (bal.balance.gt(0)) {
            creditAmount = Prisma.Decimal.min(total, bal.balance);
          }
        }
        const cashRefund = total.minus(creditAmount);

        // স্টক ফেরত (variantId সাজিয়ে, deadlock এড়াতে)
        const sorted = [...lines].sort((a, b) => a.variantId.localeCompare(b.variantId));
        for (const l of sorted) {
          await tx.productVariant.update({
            where: { id: l.variantId },
            data: { stock: { increment: l.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              variantId: l.variantId,
              change: l.quantity,
              reason: "RETURN",
              note: `বিক্রয় ফেরত ${returnNumber} (${sale.saleNumber}) — ${staffName}`,
            },
          });
        }

        const ret = await tx.saleReturn.create({
          data: {
            returnNumber,
            saleId: sale.id,
            customerId: sale.customerId,
            total,
            creditAmount,
            cashRefund,
            note: input.note,
            staffName,
            items: {
              create: lines.map((l) => ({
                saleItemId: l.saleItemId,
                variantId: l.variantId,
                name: l.name,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                unitCost: l.unitCost,
                amount: l.amount,
              })),
            },
          },
          select: { id: true, returnNumber: true },
        });

        return {
          ...ret,
          total: Number(total),
          creditAmount: Number(creditAmount),
          cashRefund: Number(cashRefund),
        };
      },
      { maxWait: 5000, timeout: 20000 }
    );
    return { ok: true, ...created };
  } catch (e) {
    if (e instanceof SaleReturnError) return { ok: false, message: e.message };
    console.error("createSaleReturn failed:", e);
    return { ok: false, message: "ফেরত সেভ করা যায়নি। আবার চেষ্টা করুন।" };
  }
}