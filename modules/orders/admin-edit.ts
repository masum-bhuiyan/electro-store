import type { Prisma } from "@/generated/prisma/client";
import { Prisma as PrismaRuntime } from "@/generated/prisma/client";
import { currentZone, withZoneLabel } from "@/lib/order-zone";
import { prisma } from "@/lib/prisma";
import { zoneAddressLabel } from "@/lib/shipping";
import type { OrderEditInput } from "./edit-validation";

export type EditResult =
  | { ok: true; changed: boolean }
  | { ok: false; message: string; errors?: Record<string, string> };

class EditError extends Error {}

const EDITABLE = ["PENDING", "CONFIRMED"] as const;

export async function editOrder(
  input: OrderEditInput,
  staffName: string
): Promise<EditResult> {
  try {
    const changed = await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: input.orderId },
          select: {
            status: true,
            address: true,
            shippingFee: true,
            shippingZone: true,
            originalShippingFee: true,
            items: {
              select: {
                id: true,
                name: true,
                unitPrice: true,
                listPrice: true,
                quantity: true,
              },
            },
          },
        });
        if (!order) throw new EditError("অর্ডারটি পাওয়া যায়নি।");

        if (!(EDITABLE as readonly string[]).includes(order.status)) {
          throw new EditError(
            "এই অবস্থায় দাম বদলানো যায় না। শুধু অপেক্ষমান বা নিশ্চিত অর্ডারে সম্ভব। পেজ রিফ্রেশ করুন।"
          );
        }

        // সব আইটেম ঠিক একবার করে আসতে হবে
        const submitted = new Map(input.items.map((i) => [i.id, i.unitPrice]));
        if (
          submitted.size !== input.items.length ||
          submitted.size !== order.items.length ||
          order.items.some((i) => !submitted.has(i.id))
        ) {
          throw new EditError("আইটেমের তথ্য মেলেনি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।");
        }

        const lines: string[] = [];
        const itemUpdates: {
          id: string;
          price: Prisma.Decimal;
          setList: Prisma.Decimal | null;
        }[] = [];
        let subtotal = new PrismaRuntime.Decimal(0);

        for (const item of order.items) {
          const newPrice = new PrismaRuntime.Decimal(submitted.get(item.id)!);
          subtotal = subtotal.add(newPrice.mul(item.quantity));
          if (!newPrice.equals(item.unitPrice)) {
            lines.push(
              `${item.name}: ৳${item.unitPrice.toString()} → ৳${newPrice.toString()}`
            );
            itemUpdates.push({
              id: item.id,
              price: newPrice,
              // পুরোনো অর্ডারে listPrice খালি থাকলে এখনকার দামই আসল দাম
              setList: item.listPrice === null ? item.unitPrice : null,
            });
          }
        }

        const oldZone = currentZone(order.shippingZone, order.address);
        const zoneChanged = input.zone !== null && input.zone !== oldZone;
        if (zoneChanged && input.zone) {
          lines.push(
            `এলাকা: ${oldZone ? zoneAddressLabel(oldZone) : "অজানা"} → ${zoneAddressLabel(input.zone)}`
          );
        }

        const newFee = new PrismaRuntime.Decimal(input.shippingFee);
        const feeChanged = !newFee.equals(order.shippingFee);
        if (feeChanged) {
          lines.push(
            `ডেলিভারি চার্জ: ৳${order.shippingFee.toString()} → ৳${newFee.toString()}`
          );
        }

        if (lines.length === 0) return false;

        const total = subtotal.add(newFee);

        const data: Prisma.OrderUpdateManyMutationInput = {
          subtotal,
          shippingFee: newFee,
          total,
        };
        if (zoneChanged && input.zone) {
          data.shippingZone = input.zone;
          data.address = withZoneLabel(order.address, input.zone);
        }
        if (feeChanged && order.originalShippingFee === null) {
          data.originalShippingFee = order.shippingFee;
        }

        // শর্ত: অবস্থা এখনো PENDING/CONFIRMED। এর মধ্যে SHIPPED হয়ে গেলে কিছুই বদলাবে না
        const updated = await tx.order.updateMany({
          where: { id: input.orderId, status: { in: [...EDITABLE] } },
          data,
        });
        if (updated.count !== 1) {
          throw new EditError(
            "অন্য কেউ এই অর্ডারটি এইমাত্র বদলেছে। পেজ রিফ্রেশ করে দেখুন।"
          );
        }

        for (const u of itemUpdates) {
          await tx.orderItem.update({
            where: { id: u.id },
            data: {
              unitPrice: u.price,
              ...(u.setList ? { listPrice: u.setList } : {}),
            },
          });
        }

        await tx.orderEdit.create({
          data: {
            orderId: input.orderId,
            staffName,
            summary: lines.join("\n"),
            reason: input.reason,
          },
        });

        return true;
      },
      { maxWait: 5000, timeout: 15000 }
    );

    return { ok: true, changed };
  } catch (e) {
    if (e instanceof EditError) return { ok: false, message: e.message };
    console.error("editOrder failed:", e);
    return {
      ok: false,
      message: "সংরক্ষণ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}