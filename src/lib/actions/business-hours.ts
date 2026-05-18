"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { businessHours, shopStaff, staffBusinessHours } from "@/lib/db/schema";
import {
  parseBusinessHoursInput,
  rowsToInputs,
  type BusinessHourInput,
} from "@/lib/shops/business-hours";
import { getShopForUser } from "@/lib/tenant";

export type BusinessHoursResult = { ok: true } | { ok: false; error: string };

export async function getShopBusinessHoursForOwner() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const shop = await getShopForUser(session.user.id, session.user.role ?? "owner");
  if (!shop) return null;

  const db = requireDb();
  const rows = await db
    .select({
      dayOfWeek: businessHours.dayOfWeek,
      openTime: businessHours.openTime,
      closeTime: businessHours.closeTime,
      isClosed: businessHours.isClosed,
    })
    .from(businessHours)
    .where(eq(businessHours.shopId, shop.id))
    .orderBy(asc(businessHours.dayOfWeek));

  return { shop, hours: rowsToInputs(rows) };
}

export async function saveShopBusinessHours(
  hoursInput: unknown,
  options?: { syncStaff?: boolean },
): Promise<BusinessHoursResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "No autenticado" };
  }
  if (session.user.role !== "owner") {
    return { ok: false, error: "Solo el dueño puede editar el horario" };
  }

  const parsed = parseBusinessHoursInput(hoursInput);
  if (!parsed.ok) return parsed;

  const shop = await getShopForUser(session.user.id, "owner");
  if (!shop) {
    return { ok: false, error: "Sin barbería" };
  }

  try {
    await applyBusinessHours(shop.id, parsed.data, options?.syncStaff ?? true);
    revalidatePath("/dashboard/configuracion/horario");
    revalidatePath(`/${shop.slug}`);
    return { ok: true };
  } catch (err) {
    console.error("[saveShopBusinessHours]", err);
    return { ok: false, error: "No se pudo guardar el horario" };
  }
}

export async function applyBusinessHours(
  shopId: string,
  hours: BusinessHourInput[],
  syncStaff: boolean,
) {
  const db = requireDb();

  const existing = await db
    .select()
    .from(businessHours)
    .where(eq(businessHours.shopId, shopId));

  const existingByDay = new Map(existing.map((r) => [r.dayOfWeek, r]));

  for (const h of hours) {
    const row = existingByDay.get(h.dayOfWeek);
    if (row) {
      await db
        .update(businessHours)
        .set({
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        })
        .where(eq(businessHours.id, row.id));
    } else {
      await db.insert(businessHours).values({
        shopId,
        dayOfWeek: h.dayOfWeek,
        openTime: h.openTime,
        closeTime: h.closeTime,
        isClosed: h.isClosed,
      });
    }
  }

  if (!syncStaff) return;

  const staff = await db
    .select({ id: shopStaff.id })
    .from(shopStaff)
    .where(eq(shopStaff.shopId, shopId));

  for (const member of staff) {
    await db
      .delete(staffBusinessHours)
      .where(eq(staffBusinessHours.staffMemberId, member.id));

    await db.insert(staffBusinessHours).values(
      hours.map((h) => ({
        staffMemberId: member.id,
        dayOfWeek: h.dayOfWeek,
        openTime: h.openTime,
        closeTime: h.closeTime,
        isClosed: h.isClosed,
      })),
    );
  }
}
