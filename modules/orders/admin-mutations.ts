import type { Prisma } from "@/generated/prisma/client";
import { NEXT_STATUSES, type OrderStatusKey } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export type StatusChangeResult = { ok: true } | { ok: false; message: string };

// transaction-এর ভেতরে এটা throw করলে সব কিছু আগের অবস্থায় ফিরে যায়
class StatusError extends Error {}

export async function changeOrderStatus(
  id: string,
  next: OrderStatusKey
): Promise<StatusChangeResult> {
  try {
    await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          select: {
            status: true,
            orderNumber: true,
            paymentMethod: true,
            items: { select: { variantId: true, quantity: true } },
          },
        });

        if (!order) throw new StatusError("অর্ডারটি পাওয়া যায়নি।");

        // এই অবস্থা থেকে সরাসরি next-এ যাওয়া অনুমোদিত কি না
        if (!NEXT_STATUSES[order.status].includes(next)) {
          throw new StatusError(
            "এই অর্ডারের অবস্থা এভাবে বদলানো যায় না। পেজ রিফ্রেশ করে বর্তমান অবস্থা দেখুন।"
          );
        }

        const data: Prisma.OrderUpdateManyMutationInput = { status: next };
        // ক্যাশ অন ডেলিভারিতে পণ্য পৌঁছালে টাকা হাতে এসেছে ধরি
        if (next === "DELIVERED" && order.paymentMethod === "COD") {
          data.paymentStatus = "PAID";
        }

        // শর্ত: অবস্থা এখনো আগেরটাই। অন্য কেউ এর মধ্যে বদলে দিলে কিছুই বদলায় না
        const updated = await tx.order.updateMany({
          where: { id, status: order.status },
          data,
        });
        if (updated.count !== 1) {
          throw new StatusError(
            "অন্য কেউ এই অর্ডারটি এইমাত্র বদলেছে। পেজ রিফ্রেশ করে দেখুন।"
          );
        }

        // বাতিল হলে পণ্যগুলো স্টকে ফেরত
        if (next === "CANCELLED") {
          const qtyByVariant = new Map<string, number>();
          for (const item of order.items) {
            qtyByVariant.set(
              item.variantId,
              (qtyByVariant.get(item.variantId) ?? 0) + item.quantity
            );
          }

          // দিন ৭-এর মতো আইডি অনুযায়ী সাজিয়ে কাজ করি, যাতে দুটো কাজ একে অপরকে আটকে না দেয়
          const lines = [...qtyByVariant.entries()].sort((a, b) =>
            a[0] < b[0] ? -1 : 1
          );

          for (const [variantId, quantity] of lines) {
            await tx.productVariant.update({
              where: { id: variantId },
              data: { stock: { increment: quantity } },
            });
            await tx.stockMovement.create({
              data: {
                variantId,
                change: quantity,
                reason: "RETURN",
                note: `Cancelled ${order.orderNumber}`,
              },
            });
          }
        }
      },
      { maxWait: 5000, timeout: 15000 }
    );

    return { ok: true };
  } catch (e) {
    if (e instanceof StatusError) {
      return { ok: false, message: e.message };
    }
    console.error("changeOrderStatus failed:", e);
    return {
      ok: false,
      message: "অবস্থা বদলানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}