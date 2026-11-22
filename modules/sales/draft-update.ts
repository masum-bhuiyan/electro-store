import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { variantLabel } from "@/modules/orders/preview-cart";
import type { CreateSaleResult } from "./create-sale";
import type { SaleInput } from "./validation";

class UpdateError extends Error {}

// ড্রাফট এডিট। স্টক শুধু পার্থক্য অনুযায়ী কমে/বাড়ে।
// input.status === "CONFIRMED" হলে এডিটের সাথে সাথে কনফার্মও হয়
export async function updateDraft(
  id: string,
  input: SaleInput,
  staffName: string,
  canCreateCustomer: boolean
): Promise<CreateSaleResult> {
  const confirming = input.status === "CONFIRMED";

  const itemsTotal = input.items.reduce(
    (sum, it) => sum.plus(it.unitPrice.times(it.quantity)),
    new Prisma.Decimal(0)
  );
  const subtotal = itemsTotal.minus(input.extraDiscount);
  const newItemMap = new Map(input.items.map((i) => [i.variantId, i]));

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // একসাথে দুজন একই ড্রাফট বদলাতে পারবে না
        await tx.$queryRaw`SELECT id FROM "Sale" WHERE id = ${id} FOR UPDATE`;

        const sale = await tx.sale.findUnique({
          where: { id },
          include: { items: true },
        });
        if (!sale) throw new UpdateError("ড্রাফট পাওয়া যায়নি।");
        if (sale.status !== "DRAFT") {
          throw new UpdateError("এটা আর ড্রাফট নেই, এডিট করা যাবে না।");
        }

        // ক্রেতা ঠিক করা (createSale-এর নিয়মেই)
        let customerId: string | null = null;
        let customerType = input.customerType;
        let customerName: string | null = null;
        let customerPhone: string | null = null;

        if (input.customerId) {
          const c = await tx.customer.findUnique({
            where: { id: input.customerId },
            select: { id: true, type: true, name: true, phone: true, isActive: true },
          });
          if (!c) throw new UpdateError("ক্রেতা পাওয়া যায়নি।");
          if (!c.isActive) throw new UpdateError("এই ক্রেতা বন্ধ আছে।");
          customerId = c.id;
          customerType = c.type;
          customerName = c.name;
          customerPhone = c.phone;
        } else if (input.newCustomer) {
          const found = await tx.customer.findUnique({
            where: { phone: input.newCustomer.phone },
            select: { id: true, type: true, name: true, phone: true, isActive: true },
          });
          if (found) {
            if (!found.isActive) throw new UpdateError("এই ক্রেতা বন্ধ আছে।");
            customerId = found.id;
            customerType = found.type;
            customerName = found.name;
            customerPhone = found.phone;
          } else {
            if (!canCreateCustomer) {
              throw new UpdateError(
                "এই নম্বরে ক্রেতা নেই, নতুন ক্রেতা বানানোর অনুমতি আপনার নেই।"
              );
            }
            if (!input.newCustomer.name) {
              throw new UpdateError("এই নম্বরে ক্রেতা নেই। নতুন ক্রেতার নাম লিখুন।");
            }
            const made = await tx.customer.create({
              data: {
                type: input.newCustomer.type,
                name: input.newCustomer.name,
                phone: input.newCustomer.phone,
              },
              select: { id: true, type: true, name: true, phone: true },
            });
            customerId = made.id;
            customerType = made.type;
            customerName = made.name;
            customerPhone = made.phone;
          }
        } else if (confirming) {
          if (input.paid.lt(subtotal)) {
            throw new UpdateError(
              "বাকিতে বিক্রি করতে ক্রেতার ফোন নম্বর দিন। walk-in ক্রেতার পুরো টাকা নিতে হবে।"
            );
          }
        } else {
          customerName = input.looseName;
        }

        // স্টকের পার্থক্য: আগে কত আটকানো ছিল, এখন কত
        const oldQty = new Map<string, number>();
        for (const it of sale.items) {
          oldQty.set(it.variantId, (oldQty.get(it.variantId) ?? 0) + it.quantity);
        }
        const allIds = [
          ...new Set([...oldQty.keys(), ...newItemMap.keys()]),
        ].sort((a, b) => a.localeCompare(b));

        const itemRows: Prisma.SaleItemCreateWithoutSaleInput[] = [];

        for (const vid of allIds) {
          const v = await tx.productVariant.findUnique({
            where: { id: vid },
            include: { product: { select: { name: true, isActive: true } } },
          });
          if (!v) throw new UpdateError("একটি পণ্য পাওয়া যায়নি।");

          const label = variantLabel(v);
          const name = label ? `${v.product.name} (${label})` : v.product.name;

          const before = oldQty.get(vid) ?? 0;
          const wanted = newItemMap.get(vid);
          const after = wanted?.quantity ?? 0;
          const delta = after - before;

          if (delta > 0) {
            if (!v.product.isActive) {
              throw new UpdateError(`"${name}" বন্ধ আছে, বিক্রি করা যাবে না।`);
            }
            const dec = await tx.productVariant.updateMany({
              where: { id: v.id, stock: { gte: delta } },
              data: { stock: { decrement: delta } },
            });
            if (dec.count !== 1) {
              throw new UpdateError(
                `"${name}": আরও ${delta}টি নেওয়ার মতো স্টক নেই (এখন ${v.stock}টি)।`
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
                note: `${sale.saleNumber} (ড্রাফট এডিট) — ${staffName}`,
              },
            });
          }

          if (wanted) {
            itemRows.push({
              variant: { connect: { id: v.id } },
              name,
              quantity: wanted.quantity,
              listPrice: v.price,
              unitPrice: wanted.unitPrice,
              unitCost: v.costPrice,
            });
          }
        }

        await tx.saleItem.deleteMany({ where: { saleId: id } });

        return tx.sale.update({
          where: { id },
          data: {
            status: input.status,
            customerId,
            customerType,
            customerName,
            customerPhone,
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
    if (e instanceof UpdateError) return { ok: false, message: e.message };
    console.error("updateDraft failed:", e);
    return { ok: false, message: "ড্রাফট আপডেট করা যায়নি। আবার চেষ্টা করুন।" };
  }
}