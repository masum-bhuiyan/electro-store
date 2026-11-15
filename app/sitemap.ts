import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getStoreCategories } from "@/modules/catalog/queries";
import { getSitemapProducts } from "@/modules/products/queries";

// প্রোডাক্ট বদলালে সাইটম্যাপও বদলাতে হবে, তাই প্রতিবার নতুন করে বানাই
export const dynamic = "force-dynamic";

// স্থির পেজগুলো (policy ও company)
const INFO_PATHS = [
  "/about",
  "/founder",
  "/contact",
  "/delivery-rules",
  "/refund-warranty",
  "/complaint",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    getSitemapProducts(),
    getStoreCategories(),
  ]);

  // প্রধান ও সাব-ক্যাটাগরি (শুধু যেগুলোতে চালু প্রোডাক্ট আছে)
  const categorySlugs = categories.flatMap((c) => [
    c.slug,
    ...c.children.map((ch) => ch.slug),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.8 },
    ...categorySlugs.map((slug) => ({
      url: `${SITE_URL}/category/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...INFO_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}