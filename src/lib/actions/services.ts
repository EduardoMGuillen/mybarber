"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { getShopForUser } from "@/lib/tenant";

const serviceSchema = z.object({
  name: z.string().min(2),
  durationMinutes: z.coerce.number().min(15).max(240),
  priceDisplay: z.string().optional(),
});

export async function addService(input: z.infer<typeof serviceSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const shop = await getShopForUser(session.user.id, session.user.role ?? "owner");
  if (!shop) throw new Error("Sin barbería");

  const data = serviceSchema.parse(input);
  const db = requireDb();

  await db.insert(services).values({
    shopId: shop.id,
    name: data.name,
    durationMinutes: data.durationMinutes,
    priceDisplay: data.priceDisplay || null,
  });

  revalidatePath("/dashboard/configuracion/servicios");
  revalidatePath(`/${shop.slug}`);
  return { ok: true };
}

export async function listServicesForShop(shopId: string) {
  const db = requireDb();
  return db
    .select()
    .from(services)
    .where(eq(services.shopId, shopId))
    .orderBy(asc(services.sortOrder));
}

export async function deleteService(serviceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const shop = await getShopForUser(session.user.id, session.user.role ?? "owner");
  if (!shop) throw new Error("Sin barbería");

  const db = requireDb();
  await db
    .update(services)
    .set({ active: false })
    .where(eq(services.id, serviceId));

  revalidatePath(`/${shop.slug}`);
  return { ok: true };
}
