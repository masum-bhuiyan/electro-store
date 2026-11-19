import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CustomerInput } from "./validation";

export type CustomerMutationResult =
  | { ok: true; id: string }
  | { ok: false; message: string; errors?: Record<string, string> };

// এই ফোন নম্বরে আগে থেকেই কেউ থাকলে তার নামসহ বার্তা
async function phoneTakenResult(
  phone: string
): Promise<Extract<CustomerMutationResult, { ok: false }>> {
  const other = await prisma.customer.findUnique({
    where: { phone },
    select: { name: true },
  });
  const message = other
    ? `এই নম্বরে আগে থেকেই একজন আছে: ${other.name}`
    : "এই নম্বরে আগে থেকেই একজন আছে।";
  return { ok: false, message, errors: { phone: message } };
}

function isUniqueError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function createCustomer(
  data: CustomerInput
): Promise<CustomerMutationResult> {
  try {
    const created = await prisma.customer.create({
      data,
      select: { id: true },
    });
    return { ok: true, id: created.id };
  } catch (e) {
    if (isUniqueError(e)) return phoneTakenResult(data.phone);
    console.error("createCustomer failed:", e);
    return {
      ok: false,
      message: "সংরক্ষণ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}

export async function updateCustomer(
  id: string,
  data: CustomerInput
): Promise<CustomerMutationResult> {
  try {
    const result = await prisma.customer.updateMany({ where: { id }, data });
    if (result.count !== 1) {
      return { ok: false, message: "ক্রেতাকে পাওয়া যায়নি।" };
    }
    return { ok: true, id };
  } catch (e) {
    if (isUniqueError(e)) return phoneTakenResult(data.phone);
    console.error("updateCustomer failed:", e);
    return {
      ok: false,
      message: "সংরক্ষণ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }
}

export async function setCustomerActive(
  id: string,
  isActive: boolean
): Promise<boolean> {
  const result = await prisma.customer.updateMany({
    where: { id },
    data: { isActive },
  });
  return result.count === 1;
}