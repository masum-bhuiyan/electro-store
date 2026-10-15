import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getShippingFee } from "@/lib/shipping";
import { variantLabel } from "./preview-cart";
import type { CartLineInput, ValidCustomer } from "./validation";

export type CreateOrderResult =
  | { ok: true; orderNumber: string; total: number }
  | {
      ok: false;
            code:
        | "UNAVAILABLE"
        | "OUT_OF_STOCK"
        | "PRICE_CHANGED"
        | "RATE_LIMITED"
        | "SERVER_ERROR";
      message: string;
    };

type OrderErrorCode = "UNAVAILABLE" | "OUT_OF_STOCK" | "PRICE_CHANGED";

// transaction-এর ভেতরে এটা throw করলে সব কিছু আগের অবস্থায় ফিরে যায়
class OrderError extends Error {
  code: OrderErrorCode;
  constructor(code: OrderErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

// 0, O, 1, I, L বাদ, যাতে ফোনে পড়তে ভুল না হয়
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function makeOrderNumber(): string {
  const d = new Date();
  const yy = String(d.getUTCFullYear()).slice(2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[randomInt(CODE_CHARS.length)];
  }
  return `ES-${yy}${mm}${dd}-${code}`;
}

async function findByKey(idempotencyKey: string) {
  return prisma.order.findUnique({
    where: { idempotencyKey },
    select: { orderNumber: true, total: true },
  });
}
// ভুয়া অর্ডার ঠেকানোর সীমা
const MAX_ORDERS_PER_HOUR = 3;
const MAX_PENDING_PER_PHONE = 3;

async function phoneLimitMessage(phone: string): Promise<string | null> {
  const since = new Date(Date.now() - 60 * 60 * 1000);

  const [recent, pending] = await Promise.all([
    prisma.order.count({ where: { phone, createdAt: { gte: since } } }),
    prisma.order.count({ where: { phone, status: "PENDING" } }),
  ]);

  if (recent >= MAX_ORDERS_PER_HOUR) {
    return "এই মোবাইল নম্বর থেকে অল্প সময়ে অনেক অর্ডার হয়েছে। এক ঘণ্টা পর আবার চেষ্টা করুন, অথবা আমাদের ফোন করুন।";
  }
  if (pending >= MAX_PENDING_PER_PHONE) {
    return "এই নম্বরের কয়েকটি অর্ডার এখনো নিশ্চিত হয়নি। সেগুলো নিশ্চিত হলে নতুন অর্ডার করতে পারবেন, অথবা আমাদের ফোন করুন।";
  }
  return null;
}

export async function createOrder(params: {
  customer: ValidCustomer;
  items: CartLineInput[];
  expectedSubtotal: number;
  idempotencyKey: string;
}): Promise<CreateOrderResult> {
  const { customer, items, expectedSubtotal, idempotencyKey } = params;

  // একই key দিয়ে অর্ডার আগেই হয়ে থাকলে নতুন না বানিয়ে আগেরটাই দিই
  const existing = await findByKey(idempotencyKey);
  if (existing) {
    return { ok: true, orderNumber: existing.orderNumber, total: Number(existing.total) };
  }

  try {
        const limitMessage = await phoneLimitMessage(customer.phone);
    if (limitMessage) {
      return { ok: false, code: "RATE_LIMITED", message: limitMessage };
    }
    const order = await prisma.$transaction(
      async (tx) => {
        // ১. ডাটাবেস থেকে আসল দাম ও তথ্য আনি
        const variants = await tx.productVariant.findMany({
          where: {
            id: { in: items.map((i) => i.variantId) },
            product: { isActive: true },
          },
          include: { product: { select: { name: true } } },
        });
        const byId = new Map(variants.map((v) => [v.id, v]));

        // variantId অনুযায়ী সাজাই, নিচে কারণ বলা আছে
        const lines = items
          .map((item) => {
            const v = byId.get(item.variantId);
            if (!v) {
              throw new OrderError(
                "UNAVAILABLE",
                "কার্টের একটি পণ্য আর পাওয়া যায় না। কার্ট দেখে আবার চেষ্টা করুন।"
              );
            }
            return {
              variantId: v.id,
              name: `${v.product.name} (${variantLabel(v)})`,
              unitPrice: v.price,
              quantity: item.quantity,
            };
          })
          .sort((a, b) => (a.variantId < b.variantId ? -1 : 1));

        // ২. সার্ভারের দামে হিসাব
        const subtotal = lines.reduce(
          (sum, l) => sum.add(l.unitPrice.mul(l.quantity)),
          new Prisma.Decimal(0)
        );

        // ক্রেতা যে দাম দেখে সিদ্ধান্ত নিয়েছে, তার সাথে না মিললে থামাই
        if (Math.abs(subtotal.toNumber() - expectedSubtotal) > 0.01) {
          throw new OrderError(
            "PRICE_CHANGED",
            "আপনি দেখার পর কিছু পণ্যের দাম বদলেছে। নতুন দাম দেখে আবার অর্ডার করুন।"
          );
        }

        const shippingFee = new Prisma.Decimal(getShippingFee(customer.division));
        const total = subtotal.add(shippingFee);
        const orderNumber = makeOrderNumber();

        // ৩. অর্ডার ও অর্ডারের আইটেম তৈরি
        const created = await tx.order.create({
          data: {
            orderNumber,
            idempotencyKey,
            customerName: customer.name,
            phone: customer.phone,
            address: `${customer.details}, ${customer.area}, ${customer.district}, ${customer.division} বিভাগ`,
            paymentMethod: "COD",
            subtotal,
            shippingFee,
            total,
            notes: customer.notes,
            items: {
              create: lines.map((l) => ({
                variantId: l.variantId,
                name: l.name,
                unitPrice: l.unitPrice,
                quantity: l.quantity,
              })),
            },
          },
          select: { orderNumber: true, total: true },
        });

        // ৪. স্টক কমানো (স্টক যথেষ্ট থাকলেই) ও ইতিহাস লেখা
        for (const l of lines) {
          const result = await tx.productVariant.updateMany({
            where: { id: l.variantId, stock: { gte: l.quantity } },
            data: { stock: { decrement: l.quantity } },
          });
          if (result.count !== 1) {
            throw new OrderError(
              "OUT_OF_STOCK",
              `"${l.name}" এর স্টক যথেষ্ট নেই। কার্ট দেখে আবার চেষ্টা করুন।`
            );
          }
          await tx.stockMovement.create({
            data: {
              variantId: l.variantId,
              change: -l.quantity,
              reason: "SALE",
              note: `Order ${orderNumber}`,
            },
          });
        }

        return created;
      },
      { maxWait: 5000, timeout: 15000 }
    );

    return { ok: true, orderNumber: order.orderNumber, total: Number(order.total) };
  } catch (e) {
    if (e instanceof OrderError) {
      return { ok: false, code: e.code, message: e.message };
    }

    // একই key দিয়ে একসাথে দুটো অনুরোধ এলে দ্বিতীয়টা ব্যর্থ হয়, প্রথমটার অর্ডারই ফেরত দিই
    try {
      const again = await findByKey(idempotencyKey);
      if (again) {
        return { ok: true, orderNumber: again.orderNumber, total: Number(again.total) };
      }
    } catch {
      // নিচের সাধারণ বার্তায় যাব
    }

    console.error("createOrder failed:", e);
    return {
      ok: false,
      code: "SERVER_ERROR",
      message: "অর্ডার করতে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}