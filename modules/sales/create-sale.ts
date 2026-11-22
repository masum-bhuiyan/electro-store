import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { variantLabel } from "@/modules/orders/preview-cart";
import type { SaleInput } from "./validation";

export type CreateSaleResult =
  | { ok: true; id: string; saleNumber: string }
  | { ok: false; message: string };

// transaction-এর ভেতরে throw করলে সব আগের অবস্থায় ফিরে যায়
class SaleError extends Error {}

function makeSaleNumber(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `SAL-${yy}${mm}${dd}-${randomInt(100000, 999999)}`;
}

// ড্রাফট বা কনফার্মড বিক্রয় তৈরি। দুই ক্ষেত্রেই স্টক কাটে
export async function createSale(
  input: SaleInput,
  staffName: string,
  canCreateCustomer: boolean
): Promise<CreateSaleResult> {
  const isDraft = input.status === "DRAFT";

  // একই ক্রমে স্টক কমালে দুটো একসাথে চললেও আটকে যায় না
  const items = [...input.items].sort((a, b) =>
    a.variantId.localeCompare(b.variantId)
  );
  const itemsTotal = items.reduce(
    (sum, it) => sum.plus(it.unitPrice.times(it.quantity)),
    new Prisma.Decimal(0)
  );
  // subtotal = অতিরিক্ত ছাড়ের পরের প্রদেয় মোট
  const subtotal = itemsTotal.minus(input.extraDiscount);
  const saleNumber = makeSaleNumber();

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        let customerId: string | null = null;
        let customerType = input.customerType;
        let customerName: string | null = null;
        let customerPhone: string | null = null;

        if (input.customerId) {
          // সেভ করা ক্রেতা: তথ্য ডাটাবেস থেকে নিই
          const c = await tx.customer.findUnique({
            where: { id: input.customerId },
            select: { id: true, type: true, name: true, phone: true, isActive: true },
          });
          if (!c) throw new SaleError("ক্রেতা পাওয়া যায়নি।");
          if (!c.isActive) throw new SaleError("এই ক্রেতা বন্ধ আছে।");
          customerId = c.id;
          customerType = c.type;
          customerName = c.name;
          customerPhone = c.phone;
        } else if (input.newCustomer) {
          // ফোন দিয়ে পুরনো ক্রেতা খুঁজি, না পেলে নতুন বানাই
          const found = await tx.customer.findUnique({
            where: { phone: input.newCustomer.phone },
            select: { id: true, type: true, name: true, phone: true, isActive: true },
          });
          if (found) {
            if (!found.isActive) throw new SaleError("এই ক্রেতা বন্ধ আছে।");
            customerId = found.id;
            customerType = found.type;
            customerName = found.name;
            customerPhone = found.phone;
          } else {
            if (!canCreateCustomer) {
              throw new SaleError(
                "এই নম্বরে ক্রেতা নেই, নতুন ক্রেতা বানানোর অনুমতি আপনার নেই।"
              );
            }
            if (!input.newCustomer.name) {
              throw new SaleError("এই নম্বরে ক্রেতা নেই। নতুন ক্রেতার নাম লিখুন।");
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
        } else if (!isDraft) {
          // walk-in ক্রেতার বাকি দেওয়া যাবে না
          if (input.paid.lt(subtotal)) {
            throw new SaleError(
              "বাকিতে বিক্রি করতে ক্রেতার ফোন নম্বর দিন। walk-in ক্রেতার পুরো টাকা নিতে হবে।"
            );
          }
        } else {
          // ড্রাফট: ফোন ছাড়া শুধু নাম
          customerName = input.looseName;
        }

        const itemRows: Prisma.SaleItemCreateWithoutSaleInput[] = [];

        for (const it of items) {
          const v = await tx.productVariant.findUnique({
            where: { id: it.variantId },
            include: { product: { select: { name: true, isActive: true } } },
          });
          if (!v) throw new SaleError("একটি পণ্য পাওয়া যায়নি।");

          const label = variantLabel(v);
          const name = label ? `${v.product.name} (${label})` : v.product.name;

          if (!v.product.isActive) {
            throw new SaleError(`"${name}" বন্ধ আছে, বিক্রি করা যাবে না।`);
          }

          // স্টক যথেষ্ট থাকলেই কমবে (অনলাইন অর্ডারের সাথে রেস হলেও নিরাপদ)
          const dec = await tx.productVariant.updateMany({
            where: { id: v.id, stock: { gte: it.quantity } },
            data: { stock: { decrement: it.quantity } },
          });
          if (dec.count !== 1) {
            throw new SaleError(
              `"${name}": স্টকে এতগুলো নেই (এখন ${v.stock}টি)।`
            );
          }

          await tx.stockMovement.create({
            data: {
              variantId: v.id,
              change: -it.quantity,
              reason: "SALE",
              note: isDraft
                ? `${saleNumber} (ড্রাফট) — ${staffName}`
                : `${saleNumber} — ${staffName}`,
            },
          });

          itemRows.push({
            variant: { connect: { id: v.id } },
            name,
            quantity: it.quantity,
            listPrice: v.price,
            unitPrice: it.unitPrice,
            unitCost: v.costPrice,
          });
        }

        return tx.sale.create({
          data: {
            saleNumber,
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
            staffName,
            items: { create: itemRows },
          },
          select: { id: true, saleNumber: true },
        });
      },
      { maxWait: 5000, timeout: 20000 }
    );

    return { ok: true, ...created };
  } catch (e) {
    if (e instanceof SaleError) return { ok: false, message: e.message };
    console.error("createSale failed:", e);
    return {
      ok: false,
      message: "বিক্রয় সেভ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}