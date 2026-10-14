import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ProductInput, VariantInput } from "./validation";

export type MutationResult =
  | { ok: true; id: string }
  | { ok: false; message: string; errors?: Record<string, string> };

// transaction-এর ভেতরে এটা throw করলে সব কিছু আগের অবস্থায় ফিরে যায়
class ProductError extends Error {
  errors: Record<string, string>;
  constructor(errors: Record<string, string>, message = "ফর্মের লাল ঘরগুলো ঠিক করুন।") {
    super(message);
    this.errors = errors;
  }
}

function toFailure(e: unknown): Extract<MutationResult, { ok: false }> {
  if (e instanceof ProductError) {
    return { ok: false, message: e.message, errors: e.errors };
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return {
      ok: false,
      message: "slug বা SKU আগে থেকেই ব্যবহৃত হয়েছে। বদলে আবার চেষ্টা করুন।",
    };
  }
  console.error("product mutation failed:", e);
  return {
    ok: false,
    message: "সংরক্ষণ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
  };
}

function productFields(data: ProductInput) {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description,
    model: data.model,
    images: data.images,
    warrantyMonths: data.warrantyMonths,
    isActive: data.isActive,
    isFeatured: data.isFeatured,
    categoryId: data.categoryId,
    brandId: data.brandId,
  };
}

function variantFields(v: VariantInput) {
  return {
    sku: v.sku,
    color: v.color,
    storage: v.storage,
    price: new Prisma.Decimal(v.price),
    comparePrice: v.comparePrice === null ? null : new Prisma.Decimal(v.comparePrice),
    costPrice: v.costPrice === null ? null : new Prisma.Decimal(v.costPrice),
  };
}

// slug, SKU ও ক্যাটাগরি/ব্র্যান্ড যাচাই। productId থাকলে সেই প্রোডাক্টের নিজের তথ্য বাদ
async function checkReferences(
  tx: Prisma.TransactionClient,
  data: ProductInput,
  productId: string | null
) {
  const errors: Record<string, string> = {};

  const slugClash = await tx.product.findFirst({
    where: { slug: data.slug, ...(productId ? { id: { not: productId } } : {}) },
    select: { id: true },
  });
  if (slugClash) errors.slug = "এই slug আগে থেকেই ব্যবহৃত";

  const skuRows = await tx.productVariant.findMany({
    where: { sku: { in: data.variants.map((v) => v.sku) } },
    select: { id: true, sku: true },
  });
  data.variants.forEach((v, i) => {
    const hit = skuRows.find((r) => r.sku === v.sku);
    // একই SKU অন্য কোনো ভ্যারিয়ান্টের হলে ভুল (নিজের হলে ঠিক আছে)
    if (hit && hit.id !== v.id) errors[`variants.${i}.sku`] = "এই SKU আগে থেকেই আছে";
  });

  const category = await tx.category.findUnique({
    where: { id: data.categoryId },
    select: { id: true },
  });
  if (!category) errors.categoryId = "এই ক্যাটাগরি পাওয়া যায়নি";

  const brand = await tx.brand.findUnique({
    where: { id: data.brandId },
    select: { id: true },
  });
  if (!brand) errors.brandId = "এই ব্র্যান্ড পাওয়া যায়নি";

  if (Object.keys(errors).length > 0) throw new ProductError(errors);
}

export async function createProduct(data: ProductInput): Promise<MutationResult> {
  const hasSpecs = Object.keys(data.specs).length > 0;

  try {
    const id = await prisma.$transaction(
      async (tx) => {
        await checkReferences(tx, data, null);

        const created = await tx.product.create({
          data: {
            ...productFields(data),
            specs: hasSpecs ? data.specs : undefined,
            variants: {
              create: data.variants.map((v) => ({
                ...variantFields(v),
                stock: v.stock,
              })),
            },
          },
          include: { variants: { select: { id: true, stock: true } } },
        });

        // শুরুর স্টকের ইতিহাস লিখি
        for (const v of created.variants) {
          if (v.stock > 0) {
            await tx.stockMovement.create({
              data: {
                variantId: v.id,
                change: v.stock,
                reason: "PURCHASE",
                note: "Initial stock (admin)",
              },
            });
          }
        }

        return created.id;
      },
      { maxWait: 5000, timeout: 15000 }
    );

    return { ok: true, id };
  } catch (e) {
    return toFailure(e);
  }
}

export async function updateProduct(
  id: string,
  data: ProductInput
): Promise<MutationResult> {
  const hasSpecs = Object.keys(data.specs).length > 0;

  try {
    await prisma.$transaction(
      async (tx) => {
        const existing = await tx.product.findUnique({
          where: { id },
          include: { variants: { select: { id: true } } },
        });
        if (!existing) {
          throw new ProductError({}, "প্রোডাক্টটি পাওয়া যায়নি।");
        }

        const ownIds = new Set(existing.variants.map((v) => v.id));
        const submittedIds = new Set<string>();

        for (const v of data.variants) {
          if (v.id) {
            if (!ownIds.has(v.id)) {
              throw new ProductError({}, "ভ্যারিয়ান্টের তথ্যে সমস্যা আছে। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।");
            }
            submittedIds.add(v.id);
          }
        }

        // বিদ্যমান ভ্যারিয়ান্ট মুছে ফেলা যাবে না (স্টকের ইতিহাস ও অর্ডারের সাথে জড়ানো)
        for (const ownId of ownIds) {
          if (!submittedIds.has(ownId)) {
            throw new ProductError(
              {},
              "বিদ্যমান ভ্যারিয়ান্ট মুছা যায় না। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"
            );
          }
        }

        await checkReferences(tx, data, id);

        await tx.product.update({
          where: { id },
          data: {
            ...productFields(data),
            specs: hasSpecs ? data.specs : Prisma.DbNull,
          },
        });

        for (const v of data.variants) {
          if (v.id) {
            // বিদ্যমান ভ্যারিয়ান্ট: স্টক ইচ্ছে করে বাদ (দিন ১১-র আলাদা পেজে বদলাবে)
            await tx.productVariant.update({
              where: { id: v.id },
              data: variantFields(v),
            });
          } else {
            const created = await tx.productVariant.create({
              data: { productId: id, ...variantFields(v), stock: v.stock },
              select: { id: true },
            });
            if (v.stock > 0) {
              await tx.stockMovement.create({
                data: {
                  variantId: created.id,
                  change: v.stock,
                  reason: "PURCHASE",
                  note: "Initial stock (admin)",
                },
              });
            }
          }
        }
      },
      { maxWait: 5000, timeout: 15000 }
    );

    return { ok: true, id };
  } catch (e) {
    return toFailure(e);
  }
}

export async function setProductActive(
  id: string,
  isActive: boolean
): Promise<boolean> {
  const result = await prisma.product.updateMany({
    where: { id },
    data: { isActive },
  });
  return result.count === 1;
}