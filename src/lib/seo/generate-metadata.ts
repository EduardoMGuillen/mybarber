import type { Metadata } from "next";
import type { ShopRow } from "@/lib/tenant";
import { isShopIndexable } from "@/lib/profile/completeness";
import { autoSeoDescription, autoSeoTitle } from "./auto-copy";

export function generateShopMetadata(shop: ShopRow, appUrl: string): Metadata {
  const title = autoSeoTitle(shop);
  const description = autoSeoDescription(shop);
  const url = `${appUrl}/${shop.slug}`;
  const indexable = isShopIndexable(shop);

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: shop.logoUrl
        ? [{ url: shop.logoUrl, alt: shop.name }]
        : [{ url: "/og-image.png", width: 1200, height: 630, alt: shop.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
