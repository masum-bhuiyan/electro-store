import { prisma } from "@/lib/prisma";

export type DraftResult = { ok: true } | { ok: false; message: string };

class DraftError extends Error {}

// ড্রাফট মুছে স্টক ফেরত দেওয়া
export async function deleteDraft(
  id: string,
  staffName: string
): Promise<DraftResult> {
  try {
    await prisma.$transaction(
      async (tx) => {
        // একসাথে দুইজন কনফার্ম/ডিলিট করলে একজনই পাবে
        await tx.$queryRaw`SELECT id FROM "Sale" WHERE id = ${id} FOR UPDATE`;

        const sale = await tx.sale.findUnique({
          where: { id },
          include: { items: true },
        });
        if (!sale) throw new DraftError("ড্রাফট পাওয়া যায়নি।");
        if (sale.status !== "DRAFT") {
          throw new DraftError("এটা আর ড্রাফট নেই, মোছা যাবে না।");
        }

        // একই ক্রমে (variantId) স্টক ফেরত, ডেডলক এড়াতে
        const items = [...sale.items].sort((a, b) =>
          a.variantId.localeCompare(b.variantId)
        );
        for (const it of items) {
          await tx.productVariant.update({
            where: { id: it.variantId },
            data: { stock: { increment: it.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              variantId: it.variantId,
              change: it.quantity,
              reason: "RETURN",
              note: `ড্রাফট বাতিল ${sale.saleNumber} — ${staffName}`,
            },
          });
        }

        await tx.sale.delete({ where: { id } });
      },
      { maxWait: 5000, timeout: 20000 }
    );
    return { ok: true };
  } catch (e) {
    if (e instanceof DraftError) return { ok: false, message: e.message };
    console.error("deleteDraft failed:", e);
    return { ok: false, message: "ড্রাফট মোছা যায়নি। আবার চেষ্টা করুন।" };
  }
}

// ড্রাফট কনফার্ম: স্টক আগেই কাটা, তাই শুধু অবস্থা বদলায়
export async function confirmDraft(id: string): Promise<DraftResult> {
  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Sale" WHERE id = ${id} FOR UPDATE`;

        const sale = await tx.sale.findUnique({ where: { id } });
        if (!sale) throw new DraftError("ড্রাফট পাওয়া যায়নি।");
        if (sale.status !== "DRAFT") {
          throw new DraftError("এটা আগেই কনফার্ম হয়ে গেছে।");
        }
        // walk-in-এর বাকি চলবে না (POS-এর নিয়মই)
        if (!sale.customerId && sale.paid.lt(sale.subtotal)) {
          throw new DraftError(
            "ক্রেতার ফোন নম্বর ছাড়া বাকি রেখে কনফার্ম করা যাবে না। এই ড্রাফট মুছে ফোন নম্বরসহ নতুন করে করুন।"
          );
        }

        await tx.sale.update({ where: { id }, data: { status: "CONFIRMED" } });
      },
      { maxWait: 5000, timeout: 20000 }
    );
    return { ok: true };
  } catch (e) {
    if (e instanceof DraftError) return { ok: false, message: e.message };
    console.error("confirmDraft failed:", e);
    return { ok: false, message: "কনফার্ম করা যায়নি। আবার চেষ্টা করুন।" };
  }
}