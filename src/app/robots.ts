import type { MetadataRoute } from "next";
import { DEFAULT_APP_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/admin/", "/api/", "/onboarding"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
