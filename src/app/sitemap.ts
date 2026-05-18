import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { shops } from "@/lib/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://mibarberia.dev";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/precios`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/registro`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/legal/terminos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const db = requireDb();
    const activeShops = await db
      .select({ slug: shops.slug, updatedAt: shops.updatedAt })
      .from(shops)
      .where(eq(shops.status, "active"));

    const trialShops = await db
      .select({ slug: shops.slug, updatedAt: shops.updatedAt })
      .from(shops)
      .where(eq(shops.status, "trial"));

    const shopRoutes = [...activeShops, ...trialShops].map((s) => ({
      url: `${base}/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...shopRoutes];
  } catch {
    return staticRoutes;
  }
}
