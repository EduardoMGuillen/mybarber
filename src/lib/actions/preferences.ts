"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";

const prefsSchema = z.object({
  locale: z.enum(["es", "en"]),
  theme: z.enum(["dark", "light", "system"]),
  emailNewBooking: z.boolean(),
  emailBookingConfirmed: z.boolean(),
  emailTrialReminders: z.boolean(),
  emailAppointmentReminder: z.boolean(),
});

export async function updateUserPreferences(
  input: z.infer<typeof prefsSchema>,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const data = prefsSchema.parse(input);
  const db = requireDb();

  await db
    .insert(userPreferences)
    .values({
      userId: session.user.id,
      ...data,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { ...data, updatedAt: new Date() },
    });

  const cookieStore = await cookies();
  cookieStore.set("locale", data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/dashboard/configuracion/preferencias");
  return { ok: true };
}

export async function getUserPreferences(userId: string) {
  const db = requireDb();
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return prefs ?? null;
}
