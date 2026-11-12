import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { isAllowedImageUrl } from "../lib/images";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ⚠️ শুধু dev ডাটাবেসে পরীক্ষার জন্য: WordPress-এ স্টকের সংখ্যা ফাঁকা থাকলে এই সংখ্যা বসবে।
// প্রোডাকশনে ইমপোর্টের আগে এটা 0 করুন এবং আসল স্টক বসান।
const DEFAULT_STOCK_WHEN_EMPTY = 10;
const MAX_IMAGES = 6;
const CLOUDINARY_FOLDER = "bhuiyantools/products";

// নামের প্রথম শব্দ দেখে ব্র্যান্ড চিনি; না চিনলে "Others"
const KNOWN_BRANDS: Record<string, string> = {
  mechanic: "Mechanic",
  koocu: "Koocu",
  relife: "Relife",
  "h-speed": "H-Speed",
  kimei: "Kimei",
  tg: "TG",
  semtech: "Semtech",
  pragmafix: "Pragmafix",
  sugon: "Sugon",
  atten: "ATTEN",
  sunshine: "Sunshine",
  zhaoxin: "Zhaoxin",
  oss: "OSS Team",
  aifen: "Aifen",
};

type Row = Record<string, string>;

// ---------- CSV পড়া (কোটের ভেতরের কমা ও নতুন লাইন সামলায়) ----------
function parseCsv(text: string): Row[] {
  const src = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((c) => c !== "")) rows.push(row);
  }

  const [header, ...body] = rows;
  return body.map((cells) => {
    const obj: Row = {};
    header.forEach((h, idx) => (obj[h] = (cells[idx] ?? "").trim()));
    return obj;
  });
}

// ---------- ছোট সাহায্যকারী ফাংশন ----------
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function parseMoney(value: string | undefined): number {
  const n = Number((value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function htmlToText(html: string): string {
  return html
    .replace(/\\[nrt]/g, " ") // এক্সপোর্টে আসা আক্ষরিক \n \r \t
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|ul|ol|h[1-6])>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detectBrand(name: string): string {
  const first = name.split(/[\s/]+/)[0]?.toLowerCase() ?? "";
  return KNOWN_BRANDS[first] ?? "Others";
}

// "A, B > C" থেকে সবচেয়ে নির্দিষ্ট ক্যাটাগরি (গভীরতম) বেছে নিই; "All Products" বাদ
function pickCategory(raw: string): { parent: string | null; name: string } {
  const paths = raw
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && p.toLowerCase() !== "all products")
    .map((p) => p.split(">").map((s) => s.trim()));
  if (paths.length === 0) return { parent: null, name: "Uncategorized" };
  const best = paths.reduce((a, b) => (b.length > a.length ? b : a));
  return best.length > 1
    ? { parent: best[0], name: best[best.length - 1] }
    : { parent: null, name: best[0] };
}

function imageUrlsOf(raw: string): string[] {
  return raw
    .split(/,\s*(?=https?:\/\/)/)
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, MAX_IMAGES);
}

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim() === "import";
}

// ---------- Cloudinary আপলোড (সই করা অনুরোধ, কোনো নতুন প্যাকেজ লাগে না) ----------
async function uploadToCloudinary(sourceUrl: string, publicId: string): Promise<string> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !apiKey || !apiSecret) {
    throw new Error(".env-এ CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET নেই।");
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  // সইয়ের জন্য প্যারামিটারগুলো বর্ণানুক্রমে সাজাতে হয়
  const toSign = `folder=${CLOUDINARY_FOLDER}&overwrite=true&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  const form = new FormData();
  form.append("file", sourceUrl);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("folder", CLOUDINARY_FOLDER);
  form.append("public_id", publicId);
  form.append("overwrite", "true");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message ?? `Cloudinary error ${res.status}`);
  }
  if (!isAllowedImageUrl(data.secure_url)) {
    throw new Error("Cloudinary থেকে পাওয়া লিংক আমাদের নিয়মে মেলেনি।");
  }
  return data.secure_url;
}

// ---------- ক্যাটাগরি ও ব্র্যান্ড (একবার বানিয়ে মনে রাখি) ----------
const categoryCache = new Map<string, string>();
const brandCache = new Map<string, string>();

async function getCategoryId(parent: string | null, name: string): Promise<string> {
  const key = `${parent ?? ""}>${name}`;
  const cached = categoryCache.get(key);
  if (cached) return cached;

  let parentId: string | null = null;
  if (parent) {
    const p = await prisma.category.upsert({
      where: { slug: slugify(parent) },
      create: { name: parent, slug: slugify(parent) },
      update: {},
    });
    parentId = p.id;
  }
  const c = await prisma.category.upsert({
    where: { slug: slugify(name) },
    create: { name, slug: slugify(name), parentId },
    update: {},
  });
  categoryCache.set(key, c.id);
  return c.id;
}

async function getBrandId(name: string): Promise<string> {
  const cached = brandCache.get(name);
  if (cached) return cached;
  const b = await prisma.brand.upsert({
    where: { slug: slugify(name) },
    create: { name, slug: slugify(name) },
    update: {},
  });
  brandCache.set(name, b.id);
  return b.id;
}

async function uniqueSlug(base: string, wpId: string): Promise<string> {
  const exists = await prisma.product.findUnique({ where: { slug: base }, select: { id: true } });
  return exists ? `${base}-${wpId}`.slice(0, 90) : base;
}

// ---------- মূল কাজ ----------
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) throw new Error("CSV ফাইলের পথ দিন। যেমন: npm run import-products -- prisma/data/wc-products.csv --dry-run");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL পাওয়া যায়নি।");
  const dbHost = new URL(dbUrl).hostname;

  const rows = parseCsv(readFileSync(file, "utf8")).filter((r) => r["Name"]);
  console.log(`📄 CSV-তে ${rows.length}টি প্রোডাক্ট।`);
  console.log(`🗄️  ডাটাবেস হোস্ট: ${dbHost}`);
  console.log(dryRun ? "🔍 DRY-RUN: কিছু লেখা বা আপলোড হবে না।" : "✍️  আসল ইমপোর্ট: ডাটাবেসে লেখা ও ছবি আপলোড হবে।");
  console.log(`📦 স্টক ফাঁকা থাকলে ধরা হবে: ${DEFAULT_STOCK_WHEN_EMPTY}\n`);

  if (!dryRun) {
    if (!stdin.isTTY) throw new Error("এই স্ক্রিপ্ট সরাসরি টার্মিনালে চালাতে হবে।");
    const ok = await confirm('এটা কি আপনার DEV ডাটাবেস? চালিয়ে যেতে "import" লিখুন: ');
    if (!ok) {
      console.log("বাতিল করা হলো।");
      return;
    }
  }

  let created = 0;
  let skipped = 0;
  const failed: string[] = [];
  const inactive: string[] = [];

  for (const r of rows) {
    const wpId = r["ID"];
    const name = r["Name"].replace(/\s+/g, " ").trim();
    const sku = `BT-${wpId}`;
    const label = `${wpId} ${name.slice(0, 40)}`;

    try {
      const already = await prisma.productVariant.findUnique({ where: { sku }, select: { id: true } });
      if (already) {
        skipped++;
        console.log(`⏭️  আগেই আছে: ${label}`);
        continue;
      }

      const regular = parseMoney(r["Regular price"]);
      const sale = parseMoney(r["Sale price"]);
      const price = sale || regular;
      const comparePrice = sale && regular > sale ? regular : null;
      const hasPrice = price > 0;
      const isActive = hasPrice && r["Published"] === "1";

      const stockRaw = r["Stock"];
      const stockGiven = stockRaw !== "" && Number.isFinite(Number(stockRaw));
      const stock = stockGiven ? Math.max(0, Math.floor(Number(stockRaw))) : DEFAULT_STOCK_WHEN_EMPTY;

      const brand = detectBrand(name);
      const category = pickCategory(r["Categories"]);
      const description = htmlToText(r["Description"]) || htmlToText(r["Short description"]) || name;
      const images = imageUrlsOf(r["Images"]);

      if (!hasPrice) inactive.push(label);

      console.log(
        `${dryRun ? "🔎" : "➕"} ${label} | ব্র্যান্ড: ${brand} | ক্যাটাগরি: ${category.parent ? category.parent + " > " : ""}${category.name} | দাম: ${price}${comparePrice ? ` (আগে ${comparePrice})` : ""} | স্টক: ${stock}${stockGiven ? "" : " (ধরা)"} | ছবি: ${images.length} | ${isActive ? "চালু" : "নিষ্ক্রিয়"}`
      );
      if (dryRun) continue;

      // ছবি আগে আপলোড; একটাও ব্যর্থ হলে প্রোডাক্ট বানাই না, যাতে আবার চালালে চেষ্টা হয়
      const uploaded: string[] = [];
      for (let i = 0; i < images.length; i++) {
        uploaded.push(await uploadToCloudinary(images[i], `wp-${wpId}-${i + 1}`));
      }

      const categoryId = await getCategoryId(category.parent, category.name);
      const brandId = await getBrandId(brand);
      const slug = await uniqueSlug(slugify(name) || `product-${wpId}`, wpId);

      await prisma.product.create({
        data: {
          name,
          slug,
          description,
          images: uploaded,
          isActive,
          categoryId,
          brandId,
          variants: {
            create: {
              sku,
              price: price.toFixed(2),
              comparePrice: comparePrice ? comparePrice.toFixed(2) : null,
              stock,
              ...(stock > 0
                ? {
                    stockMovements: {
                      create: {
                        change: stock,
                        reason: "PURCHASE",
                        note: stockGiven
                          ? "Imported from WordPress"
                          : "Imported from WordPress (stock was empty, default value)",
                      },
                    },
                  }
                : {}),
            },
          },
        },
      });
      created++;
    } catch (e) {
      failed.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
      console.error(`❌ ${label}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log("\n===== সারাংশ =====");
  console.log(`নতুন তৈরি: ${created} | আগেই ছিল: ${skipped} | ব্যর্থ: ${failed.length}`);
  if (inactive.length) {
    console.log(`\n⚠️ দাম নেই বলে নিষ্ক্রিয় (অ্যাডমিনে দাম বসিয়ে চালু করুন): ${inactive.length}টি`);
    inactive.forEach((x) => console.log("  - " + x));
  }
  if (failed.length) {
    console.log("\n❌ ব্যর্থ (আবার চালালে এগুলোই চেষ্টা হবে):");
    failed.forEach((x) => console.log("  - " + x));
  }
}

main()
  .catch((e) => {
    console.error("❌", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());