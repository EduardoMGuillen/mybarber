"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { pickStaffForAny } from "@/lib/availability/engine";
import { loadAvailabilityContext, getSlotsForBooking } from "@/lib/availability/queries";
import { requireDb } from "@/lib/db";
import { appointments } from "@/lib/db/schema";
import { sendBookingEmails } from "@/lib/emails/booking";
import { isShopPubliclyAccessible } from "@/lib/tenant";
import { getShopBySlug } from "@/lib/tenant";

const bookingSchema = z.object({
  slug: z.string(),
  serviceId: z.string().uuid(),
  staffMemberId: z.string().uuid().optional(),
  preference: z.enum(["specific", "any"]),
  startAt: z.string(),
  clientName: z.string().min(2),
  clientPhone: z.string().min(8),
  clientEmail: z.string().email().optional().or(z.literal("")),
});

export async function getAvailableSlotsAction(params: {
  slug: string;
  serviceId: string;
  dateFrom: string;
  dateTo: string;
  staffMemberId?: string;
  preference: "specific" | "any";
}) {
  const shop = await getShopBySlug(params.slug);
  if (!shop || !isShopPubliclyAccessible(shop)) return [];

  return getSlotsForBooking(shop, params);
}

export async function createPublicAppointment(
  input: z.infer<typeof bookingSchema>,
) {
  const data = bookingSchema.parse(input);
  const shop = await getShopBySlug(data.slug);
  if (!shop || !isShopPubliclyAccessible(shop)) {
    throw new Error("Barbería no disponible");
  }

  const slots = await getSlotsForBooking(shop, {
    serviceId: data.serviceId,
    dateFrom: data.startAt.slice(0, 10),
    dateTo: data.startAt.slice(0, 10),
    staffMemberId: data.staffMemberId,
    preference: data.preference,
  });

  const slot = slots.find((s) => s.startAt === data.startAt);
  if (!slot) throw new Error("Ese horario ya no está disponible");

  const ctx = await loadAvailabilityContext(shop.id);
  let staffMemberId = data.staffMemberId;

  if (data.preference === "any") {
    staffMemberId = pickStaffForAny(slot, ctx.staffSchedules) ?? undefined;
  }

  if (!staffMemberId || !slot.availableStaffIds.includes(staffMemberId)) {
    throw new Error("Ese horario ya no está disponible");
  }

  const service = ctx.services.find((s) => s.id === data.serviceId);
  if (!service) throw new Error("Servicio no válido");

  const startAt = new Date(data.startAt);
  const endAt = new Date(slot.endAt);

  const db = requireDb();
  const [appointment] = await db
    .insert(appointments)
    .values({
      shopId: shop.id,
      serviceId: data.serviceId,
      staffMemberId,
      staffPreference: data.preference,
      status: "pending",
      source: "online",
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail || null,
      startAt,
      endAt,
    })
    .returning();

  const staff = ctx.staff.find((s) => s.id === staffMemberId);
  await sendBookingEmails({
    shop,
    appointment: appointment!,
    staffName: staff?.displayName ?? "Barbero",
    serviceName: service.name,
  });

  revalidatePath(`/${shop.slug}`);
  revalidatePath("/dashboard/reservas");
  return { id: appointment!.id };
}

export async function approveAppointment(appointmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const db = requireDb();
  const [appt] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!appt) throw new Error("Cita no encontrada");

  await db
    .update(appointments)
    .set({
      status: "confirmed",
      approvedAt: new Date(),
      approvedByUserId: session.user.id,
    })
    .where(eq(appointments.id, appointmentId));

  revalidatePath("/dashboard/reservas");
  return { ok: true };
}

export async function rejectAppointment(
  appointmentId: string,
  reason?: string,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const db = requireDb();
  await db
    .update(appointments)
    .set({
      status: "cancelled",
      cancellationReason: reason ?? "Rechazada por el barbero",
    })
    .where(eq(appointments.id, appointmentId));

  revalidatePath("/dashboard/reservas");
  return { ok: true };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "cancelled" | "completed" | "no_show",
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const db = requireDb();
  await db
    .update(appointments)
    .set({ status })
    .where(eq(appointments.id, appointmentId));

  revalidatePath("/dashboard/reservas");
  return { ok: true };
}

export async function reassignAppointmentStaff(
  appointmentId: string,
  staffMemberId: string,
) {
  const session = await auth();
  if (session?.user?.role !== "owner") throw new Error("Solo el dueño puede reasignar");

  const db = requireDb();
  await db
    .update(appointments)
    .set({ staffMemberId })
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.status, "pending"),
      ),
    );

  revalidatePath("/dashboard/reservas");
  return { ok: true };
}
