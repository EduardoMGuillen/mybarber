import type { ShopRow } from "@/lib/tenant";

type Hours = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

const DAY_MAP = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function buildLocalBusinessJsonLd(
  shop: ShopRow,
  hours: Hours[],
  services: { name: string; priceDisplay?: string | null }[],
  appUrl: string,
) {
  const openingHours = hours
    .filter((h) => !h.isClosed)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_MAP[h.dayOfWeek],
      opens: h.openTime,
      closes: h.closeTime,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: shop.name,
    description: shop.description,
    image: shop.logoUrl ?? `${appUrl}/brand/mibarberia-logo.png`,
    telephone: shop.phone,
    url: `${appUrl}/${shop.slug}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: shop.addressLine1,
      addressLocality: shop.city,
      addressRegion: shop.state,
      addressCountry: shop.country,
      postalCode: shop.postalCode ?? undefined,
    },
    geo:
      shop.lat && shop.lng
        ? {
            "@type": "GeoCoordinates",
            latitude: shop.lat,
            longitude: shop.lng,
          }
        : undefined,
    openingHoursSpecification: openingHours,
    hasOfferCatalog:
      services.length > 0
        ? {
            "@type": "OfferCatalog",
            name: "Servicios",
            itemListElement: services.map((s) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: s.name,
              },
              price: s.priceDisplay ?? undefined,
            })),
          }
        : undefined,
    sameAs: shop.instagramUrl ? [shop.instagramUrl] : undefined,
  };
}
