"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { getShopForUser, requireShopAccess } from "@/lib/tenant";

const serviceSchema = z.object({
  name: z.string().min(2, "Nombre del servicio muy corto"),
  durationMinutes: z.coerce
    .number()
    .min(15, "Mínimo 15 minutos")
    .max(240, "Máximo 240 minutos"),
  priceDisplay: z.string().optional(),
});

export type ServiceActionResult = { ok: true } | { ok: false; error: string };

export async function addService(
  input: unknown,
  shopId?: string,
): Promise<ServiceActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "No autenticado" };
  }

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos del servicio inválidos",
    };
  }

  const data = parsed.data;
  const role = session.user.role ?? "owner";

  try {
    const shop = shopId
      ? await requireShopAccess(session.user.id, role, shopId)
      : await getShopForUser(session.user.id, role);

    if (!shop) {
      return { ok: false, error: "Sin barbería" };
    }

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
  } catch (err) {
    console.error("[addService]", err);
    return {
      ok: false,
      error: "No se pudo agregar el servicio. Inténtalo de nuevo.",
    };
  }
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
