import type { CustomerTypeKey } from "@/lib/customer-type";
import { prisma } from "@/lib/prisma";
import { variantLabel } from "@/modules/orders/preview-cart";
import { normalizePhone } from "@/modules/orders/validation";

export type SaleVariantRow = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  stock: number;
  price: number;
  // কেনা দাম: শুধু costPrice.view থাকলে পাঠানো হয়, নইলে null
  costPrice: number | null;
  // ব্রাউজারে খোঁজার জন্য (ছোট হাতের নাম + SKU + বারকোড + ব্র্যান্ড)
  search: string;
};

export type SaleCustomerRow = {
  id: string;
  type: CustomerTypeKey;
  name: string;
  contactName: string | null;
  phone: string;
};

const CATALOG_LIMIT = 5000;

// POS খোলার সময় একবার: সব চালু পণ্যের হালকা তালিকা। খোঁজা হবে ব্রাউজারে
export async function getSaleCatalog(
  includeCost: boolean
): Promise<SaleVariantRow[]> {
  const rows = await prisma.productVariant.findMany({
    where: { product: { isActive: true } },
    orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
    take: CATALOG_LIMIT,
    include: {
      product: { select: { name: true, brand: { select: { name: true } } } },
    },
  });

  return rows.map((v) => {
    const label = variantLabel(v);
    const name = label ? `${v.product.name} (${label})` : v.product.name;
    return {
      id: v.id,
      name,
      sku: v.sku,
      barcode: v.barcode,
      stock: v.stock,
      price: Number(v.price),
      costPrice: includeCost && v.costPrice ? Number(v.costPrice) : null,
      search: `${name} ${v.sku} ${v.barcode ?? ""} ${v.product.brand.name}`.toLowerCase(),
    };
  });
}

const customerSelect = {
  id: true,
  type: true,
  name: true,
  contactName: true,
  phone: true,
} as const;

// বাংলা অঙ্ককে ইংরেজি অঙ্কে বদলায়
function toEnglishDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
}

export async function searchSaleCustomers(q: string): Promise<SaleCustomerRow[]> {
  const term = toEnglishDigits(q.trim().slice(0, 50));
  if (term.length < 2) return [];

  // শুধু অঙ্ক/চিহ্ন হলে ফোন নম্বর ধরে খুঁজি (+88, 88, স্পেস, - বাদ)
  const looksLikePhone = /^[\d\s+\-]+$/.test(term);
  const digits = term.replace(/\D/g, "").replace(/^(?:\+?88)(?=0?1)/, "");

  if (looksLikePhone) {
    if (digits.length < 3) return [];
    return prisma.customer.findMany({
      where: { isActive: true, phone: { contains: digits } },
      orderBy: { name: "asc" },
      take: 8,
      select: customerSelect,
    });
  }

  return prisma.customer.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { contactName: { contains: term, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: 8,
    select: customerSelect,
  });
}

// ফোন নম্বর দিয়ে ঠিক একজন ক্রেতা (নম্বর ঠিক না হলে বা না পেলে null)
export async function findSaleCustomerByPhone(
  raw: string
): Promise<SaleCustomerRow | null> {
  const phone = normalizePhone(raw);
  if (!phone) return null;
  return prisma.customer.findFirst({
    where: { phone, isActive: true },
    select: customerSelect,
  });
}

// কোন পণ্য কেনা দামের নিচে যাচ্ছে (কেনা দাম ব্রাউজারে না পাঠিয়ে সার্ভারে মেলানো)
export async function findBelowCost(
  items: { variantId: string; unitPrice: number }[]
): Promise<string[]> {
  const rows = await prisma.productVariant.findMany({
    where: { id: { in: items.map((i) => i.variantId) } },
    select: { id: true, costPrice: true },
  });
  const cost = new Map(rows.map((r) => [r.id, r.costPrice]));

  return items
    .filter((i) => {
      const c = cost.get(i.variantId);
      return c !== null && c !== undefined && i.unitPrice < Number(c);
    })
    .map((i) => i.variantId);
}