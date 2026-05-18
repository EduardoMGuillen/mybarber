import { and, eq, or } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { shops, shopStaff, users } from "@/lib/db/schema";

export type ShopRow = typeof shops.$inferSelect;

export async function getShopBySlug(slug: string) {
  const db = requireDb();
  const [shop] = await db
    .select()
    .from(shops)
    .where(eq(shops.slug, slug.toLowerCase()))
    .limit(1);
  return shop ?? null;
}

export async function getShopForOwner(userId: string) {
  const db = requireDb();
  const [shop] = await db
    .select()
    .from(shops)
    .where(eq(shops.ownerUserId, userId))
    .limit(1);
  return shop ?? null;
}

export async function getShopForUser(userId: string, role: string) {
  if (role === "owner") {
    return getShopForOwner(userId);
  }
  if (role === "staff") {
    const db = requireDb();
    const [row] = await db
      .select({ shop: shops })
      .from(shopStaff)
      .innerJoin(shops, eq(shopStaff.shopId, shops.id))
      .where(eq(shopStaff.userId, userId))
      .limit(1);
    return row?.shop ?? null;
  }
  return null;
}

export function isShopPubliclyAccessible(shop: ShopRow): boolean {
  if (shop.status === "suspended") return false;
  if (shop.status === "pending_payment") return false;
  if (shop.status === "trial" && shop.trialEndsAt < new Date()) return false;
  return shop.status === "trial" || shop.status === "active";
}

export async function requireShopAccess(userId: string, role: string, shopId: string) {
  const db = requireDb();
  if (role === "superadmin") {
    const [shop] = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    return shop ?? null;
  }
  if (role === "owner") {
    const [shop] = await db
      .select()
      .from(shops)
      .where(and(eq(shops.id, shopId), eq(shops.ownerUserId, userId)))
      .limit(1);
    return shop ?? null;
  }
  if (role === "staff") {
    const [row] = await db
      .select({ shop: shops })
      .from(shopStaff)
      .innerJoin(shops, eq(shopStaff.shopId, shops.id))
      .where(and(eq(shopStaff.shopId, shopId), eq(shopStaff.userId, userId)))
      .limit(1);
    return row?.shop ?? null;
  }
  return null;
}

export async function getStaffMemberForUser(userId: string, shopId: string) {
  const db = requireDb();
  const [staff] = await db
    .select()
    .from(shopStaff)
    .where(and(eq(shopStaff.shopId, shopId), eq(shopStaff.userId, userId)))
    .limit(1);
  return staff ?? null;
}
