import type { ShopRow } from "@/lib/tenant";

export function autoSeoTitle(shop: Pick<ShopRow, "name" | "city" | "seoTitle">) {
  if (shop.seoTitle) return shop.seoTitle;
  const city = shop.city ? ` en ${shop.city}` : "";
  return `${shop.name} — Barbería${city} | MiBarbería`;
}

export function autoSeoDescription(
  shop: Pick<ShopRow, "description" | "city" | "seoDescription">,
) {
  if (shop.seoDescription) return shop.seoDescription;
  const base = shop.description?.slice(0, 120) ?? "Reserva tu cita online.";
  const city = shop.city ? ` Barbería en ${shop.city}.` : "";
  return `${base}${city} Reserva sin pago por adelantado.`;
}
