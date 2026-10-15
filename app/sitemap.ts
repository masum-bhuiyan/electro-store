import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getSitemapProducts } from "@/modules/products/queries";

// প্রোডাক্ট বদলালে সাইটম্যাপও বদলাতে হবে, তাই প্রতিবার নতুন করে বানাই
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getSitemapProducts();

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.8 },
    ...products.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}