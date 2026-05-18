"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { pickStaffForAny } from "@/lib/availability/engine";
import {
  loadAvailabilityContext,
  getSlotsForBooking,
} from "@/lib/availability/queries";
import { requireDb } from "@/lib/db";
import { appointments, services, shopStaff } from "@/lib/db/schema";
import { sendBookingEmails } from "@/lib/emails/booking";
import { sendPushToShopTeam } from "@/lib/push/server";
import {
  createRateLimiter,
  enforceRateLimit,
} from "@/lib/ratelimit";
import {
  getShopBySlug,
  getShopForUser,
  isShopPubliclyAccessible,
} from "@/lib/tenant";

const publicBookingLimiter = createRateLimiter(10, "1 m");

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

const manualBookingSchema = z.object({
  serviceId: z.string().uuid(),
  staffMemberId: z.string().uuid(),
  startAt: z.string(),
  clientName: z.string().min(2),
  clientPhone: z.string().min(8),
  clientEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  status: z.enum(["pending", "confirmed"]).default("confirmed"),
});

async function requireShopAppointmentAccess(appointmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const db = requireDb();
  const [appt] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!appt) throw new Error("Cita no encontrada");

  const shop = await getShopForUser(
    session.user.id,
    session.user.role ?? "owner",
  );
  if (!shop || shop.id !== appt.shopId) {
    throw new Error("No autorizado");
  }

  return { session, shop, appt, db };
}

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
  await enforceRateLimit(publicBookingLimiter, "booking:public");

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

  await sendPushToShopTeam(shop.id, shop.ownerUserId, {
    title: "Nueva reserva",
    body: `${data.clientName} — ${service.name}`,
    url: "/dashboard/reservas",
  });

  revalidatePath(`/${shop.slug}`);
  revalidatePath("/dashboard/reservas");
  return { id: appointment!.id };
}

export async function createManualAppointment(
  input: z.infer<typeof manualBookingSchema>,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const shop = await getShopForUser(
    session.user.id,
    session.user.role ?? "owner",
  );
  if (!shop) throw new Error("Sin barbería");

  const data = manualBookingSchema.parse(input);
  const db = requireDb();

  const [service] = await db
    .select()
    .from(services)
    .where(
      and(eq(services.id, data.serviceId), eq(services.shopId, shop.id)),
    )
    .limit(1);
  if (!service) throw new Error("Servicio no válido");

  const [staff] = await db
    .select()
    .from(shopStaff)
    .where(
      and(
        eq(shopStaff.id, data.staffMemberId),
        eq(shopStaff.shopId, shop.id),
        eq(shopStaff.active, true),
      ),
    )
    .limit(1);
  if (!staff) throw new Error("Barbero no válido");

  const startAt = new Date(data.startAt);
  const endAt = new Date(
    startAt.getTime() + service.durationMinutes * 60 * 1000,
  );

  const [conflict] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.shopId, shop.id),
        eq(appointments.staffMemberId, data.staffMemberId),
        eq(appointments.startAt, startAt),
      ),
    )
    .limit(1);

  if (conflict) {
    throw new Error("Ese barbero ya tiene una cita en ese horario.");
  }

  const [appointment] = await db
    .insert(appointments)
    .values({
      shopId: shop.id,
      serviceId: data.serviceId,
      staffMemberId: data.staffMemberId,
      staffPreference: "specific",
      status: data.status,
      source: "manual",
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail || null,
      notes: data.notes || null,
      startAt,
      endAt,
      approvedAt: data.status === "confirmed" ? new Date() : null,
      approvedByUserId:
        data.status === "confirmed" ? session.user.id : null,
    })
    .returning();

  revalidatePath("/dashboard/reservas");
  revalidatePath("/dashboard/calendario");
  revalidatePath(`/${shop.slug}`);
  return { id: appointment!.id };
}

export async function approveAppointment(appointmentId: string) {
  const { session, shop, appt, db } =
    await requireShopAppointmentAccess(appointmentId);

  await db
    .update(appointments)
    .set({
      status: "confirmed",
      approvedAt: new Date(),
      approvedByUserId: session.user.id,
    })
    .where(eq(appointments.id, appointmentId));

  revalidatePath("/dashboard/reservas");
  revalidatePath("/dashboard/calendario");
  revalidatePath(`/${shop.slug}`);

  await sendPushToShopTeam(shop.id, shop.ownerUserId, {
    title: "Reserva confirmada",
    body: `${appt.clientName} — cita aprobada`,
    url: "/dashboard/reservas",
  });

  return { ok: true };
}

export async function rejectAppointment(
  appointmentId: string,
  reason?: string,
) {
  const { shop, db } = await requireShopAppointmentAccess(appointmentId);

  await db
    .update(appointments)
    .set({
      status: "cancelled",
      cancellationReason: reason ?? "Rechazada por el barbero",
    })
    .where(eq(appointments.id, appointmentId));

  revalidatePath("/dashboard/reservas");
  revalidatePath("/dashboard/calendario");
  revalidatePath(`/${shop.slug}`);
  return { ok: true };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "cancelled" | "completed" | "no_show",
) {
  const { shop, db } = await requireShopAppointmentAccess(appointmentId);

  await db
    .update(appointments)
    .set(
      status === "cancelled"
        ? {
            status,
            cancellationReason: "Cancelada desde el panel",
          }
        : { status },
    )
    .where(eq(appointments.id, appointmentId));

  revalidatePath("/dashboard/reservas");
  revalidatePath("/dashboard/calendario");
  revalidatePath(`/${shop.slug}`);
  return { ok: true };
}

export async function reassignAppointmentStaff(
  appointmentId: string,
  staffMemberId: string,
) {
  const session = await auth();
  if (session?.user?.role !== "owner") throw new Error("Solo el dueño puede reasignar");

  const { shop, db } = await requireShopAppointmentAccess(appointmentId);

  const [staff] = await db
    .select({ id: shopStaff.id })
    .from(shopStaff)
    .where(
      and(
        eq(shopStaff.id, staffMemberId),
        eq(shopStaff.shopId, shop.id),
        eq(shopStaff.active, true),
      ),
    )
    .limit(1);

  if (!staff) throw new Error("Barbero no válido");

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
