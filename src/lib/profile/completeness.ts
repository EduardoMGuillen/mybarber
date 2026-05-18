import type { ShopRow } from "@/lib/tenant";

export function calculateProfileCompleteness(shop: Partial<ShopRow>): number {
  let score = 0;
  const checks = [
    !!shop.name,
    !!shop.slug,
    !!shop.description && shop.description.length >= 80,
    !!shop.phone,
    !!shop.whatsappNumber,
    !!shop.addressLine1,
    !!shop.city,
    !!shop.state,
    !!shop.lat && !!shop.lng,
    !!shop.formattedAddress || !!shop.googlePlaceId,
    !!shop.logoUrl,
  ];
  score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return score;
}

export function isShopIndexable(shop: ShopRow): boolean {
  return (
    calculateProfileCompleteness(shop) >= 80 &&
    !!shop.lat &&
    !!shop.lng &&
    (shop.status === "active" ||
      (shop.status === "trial" && shop.trialEndsAt > new Date()))
  );
}
