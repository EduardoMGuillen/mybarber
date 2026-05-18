"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { shopStaff, staffBusinessHours, businessHours } from "@/lib/db/schema";
import { deleteBlobByUrl } from "@/lib/storage/blob";
import { getShopForUser } from "@/lib/tenant";

const staffSchema = z.object({
  displayName: z.string().min(2),
  bio: z.string().max(200).optional(),
  acceptsOnlineBookings: z.boolean().default(true),
});

const staffUpdateSchema = staffSchema.extend({
  staffMemberId: z.string().uuid(),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

export async function addStaffMember(input: z.infer<typeof staffSchema>) {
  const session = await auth();
  if (session?.user?.role !== "owner") throw new Error("Solo el dueño puede añadir barberos");

  const shop = await getShopForUser(session.user.id, "owner");
  if (!shop) throw new Error("Sin barbería");

  const data = staffSchema.parse(input);
  const db = requireDb();

  const [member] = await db
    .insert(shopStaff)
    .values({
      shopId: shop.id,
      displayName: data.displayName,
      bio: data.bio || null,
      acceptsOnlineBookings: data.acceptsOnlineBookings,
      sortOrder: 99,
    })
    .returning();

  const hours = await db
    .select()
    .from(businessHours)
    .where(eq(businessHours.shopId, shop.id));

  if (member && hours.length) {
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

  revalidatePath("/dashboard/configuracion/equipo");
  revalidatePath(`/${shop.slug}`);
  return { id: member!.id };
}

export async function updateStaffMember(input: z.infer<typeof staffUpdateSchema>) {
  const session = await auth();
  if (session?.user?.role !== "owner") throw new Error("Solo el dueño puede editar barberos");

  const shop = await getShopForUser(session.user.id, "owner");
  if (!shop) throw new Error("Sin barbería");

  const data = staffUpdateSchema.parse(input);
  const db = requireDb();

  const [existing] = await db
    .select()
    .from(shopStaff)
    .where(eq(shopStaff.id, data.staffMemberId))
    .limit(1);

  if (!existing || existing.shopId !== shop.id) {
    throw new Error("Barbero no encontrado");
  }

  const photoUrl = data.photoUrl || null;
  if (existing.photoUrl && existing.photoUrl !== photoUrl) {
    await deleteBlobByUrl(existing.photoUrl);
  }

  await db
    .update(shopStaff)
    .set({
      displayName: data.displayName,
      bio: data.bio || null,
      acceptsOnlineBookings: data.acceptsOnlineBookings,
      photoUrl,
    })
    .where(eq(shopStaff.id, data.staffMemberId));

  revalidatePath("/dashboard/configuracion/equipo");
  revalidatePath(`/${shop.slug}`);
  return { ok: true };
}

export async function toggleStaffActive(staffMemberId: string, active: boolean) {
  const session = await auth();
  if (session?.user?.role !== "owner") throw new Error("No autorizado");

  const shop = await getShopForUser(session.user.id, "owner");
  if (!shop) throw new Error("Sin barbería");

  const db = requireDb();
  const [member] = await db
    .select({ shopId: shopStaff.shopId })
    .from(shopStaff)
    .where(eq(shopStaff.id, staffMemberId))
    .limit(1);

  if (!member || member.shopId !== shop.id) throw new Error("Barbero no encontrado");

  await db.update(shopStaff).set({ active }).where(eq(shopStaff.id, staffMemberId));

  revalidatePath("/dashboard/configuracion/equipo");
  revalidatePath(`/${shop.slug}`);
  return { ok: true };
}
