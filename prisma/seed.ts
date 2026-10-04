import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // আগের ডেটা পরিষ্কার (শুধু ডেভেলপমেন্টে)
  await prisma.stockMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();

  const [phones, audio, accessories] = await Promise.all([
    prisma.category.create({ data: { name: "স্মার্টফোন", slug: "smartphones" } }),
    prisma.category.create({ data: { name: "অডিও", slug: "audio" } }),
    prisma.category.create({ data: { name: "অ্যাক্সেসরিজ", slug: "accessories" } }),
  ]);

  const [samsung, xiaomi, anker, jbl] = await Promise.all([
    prisma.brand.create({ data: { name: "Samsung", slug: "samsung" } }),
    prisma.brand.create({ data: { name: "Xiaomi", slug: "xiaomi" } }),
    prisma.brand.create({ data: { name: "Anker", slug: "anker" } }),
    prisma.brand.create({ data: { name: "JBL", slug: "jbl" } }),
  ]);

  const items = [
    {
      name: "Samsung Galaxy A55 5G", slug: "samsung-galaxy-a55", model: "SM-A556",
      categoryId: phones.id, brandId: samsung.id, warrantyMonths: 12, isFeatured: true,
      description: "৬.৬ ইঞ্চি Super AMOLED ডিসপ্লে, ৫০০০mAh ব্যাটারি।",
      specs: { display: "6.6 inch AMOLED", battery: "5000mAh", camera: "50MP" },
      variants: [
        { sku: "A55-8-128-BLK", color: "Black", storage: "8GB/128GB", price: 52000, comparePrice: 56000, stock: 15 },
        { sku: "A55-8-256-BLU", color: "Blue", storage: "8GB/256GB", price: 58000, comparePrice: 62000, stock: 8 },
      ],
    },
    {
      name: "Xiaomi Redmi Note 13", slug: "xiaomi-redmi-note-13", model: "Note 13",
      categoryId: phones.id, brandId: xiaomi.id, warrantyMonths: 12, isFeatured: true,
      description: "১২০Hz AMOLED ডিসপ্লে, ১০৮MP ক্যামেরা।",
      specs: { display: "6.67 inch AMOLED", battery: "5000mAh", camera: "108MP" },
      variants: [
        { sku: "RN13-6-128-BLK", color: "Midnight Black", storage: "6GB/128GB", price: 24500, stock: 25 },
        { sku: "RN13-8-256-GRN", color: "Green", storage: "8GB/256GB", price: 29500, stock: 12 },
      ],
    },
    {
      name: "JBL Tune 520BT ওয়্যারলেস হেডফোন", slug: "jbl-tune-520bt", model: "Tune 520BT",
      categoryId: audio.id, brandId: jbl.id, warrantyMonths: 6, isFeatured: true,
      description: "৫৭ ঘণ্টা ব্যাটারি, JBL Pure Bass সাউন্ড।",
      specs: { battery: "57 hours", bluetooth: "5.3" },
      variants: [
        { sku: "JBL520-BLK", color: "Black", price: 4200, comparePrice: 4800, stock: 40 },
        { sku: "JBL520-WHT", color: "White", price: 4200, comparePrice: 4800, stock: 30 },
      ],
    },
    {
      name: "Anker 20W ফাস্ট চার্জার", slug: "anker-20w-charger", model: "A2633",
      categoryId: accessories.id, brandId: anker.id, warrantyMonths: 18,
      description: "USB-C ফাস্ট চার্জার, ছোট ও হালকা।",
      specs: { power: "20W", port: "USB-C" },
      variants: [{ sku: "ANK20-WHT", color: "White", price: 1650, stock: 60 }],
    },
  ];

  for (const { variants, ...product } of items) {
    const created = await prisma.product.create({
      data: { ...product, images: [], variants: { create: variants } },
      include: { variants: true },
    });
    for (const v of created.variants) {
      await prisma.stockMovement.create({
        data: { variantId: v.id, change: v.stock, reason: "PURCHASE", note: "Initial stock" },
      });
    }
  }
  console.log("✅ Seed সম্পন্ন");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());