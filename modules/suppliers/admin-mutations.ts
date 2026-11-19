import { prisma } from "@/lib/prisma";
import type { SupplierInput } from "./validation";

export type SupplierMutationResult =
  | { ok: true; id: string }
  | { ok: false; message: string; errors?: Record<string, string> };

const SAVE_FAILED = "সংরক্ষণ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।";

export async function createSupplier(
  data: SupplierInput
): Promise<SupplierMutationResult> {
  try {
    const created = await prisma.supplier.create({ data, select: { id: true } });
    return { ok: true, id: created.id };
  } catch (e) {
    console.error("createSupplier failed:", e);
    return { ok: false, message: SAVE_FAILED };
  }
}

export async function updateSupplier(
  id: string,
  data: SupplierInput
): Promise<SupplierMutationResult> {
  try {
    const result = await prisma.supplier.updateMany({ where: { id }, data });
    if (result.count !== 1) {
      return { ok: false, message: "সাপ্লায়ারকে পাওয়া যায়নি।" };
    }
    return { ok: true, id };
  } catch (e) {
    console.error("updateSupplier failed:", e);
    return { ok: false, message: SAVE_FAILED };
  }
}

export async function setSupplierActive(
  id: string,
  isActive: boolean
): Promise<boolean> {
  const result = await prisma.supplier.updateMany({
    where: { id },
    data: { isActive },
  });
  return result.count === 1;
}