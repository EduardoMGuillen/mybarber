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
import { verifyAppointmentCancelToken } from "@/lib/appointments/cancel-token";
import {
  insertAppointmentRow,
  tryLinkShopClient,
} from "@/lib/clients/link";
import { formatDateTime } from "@/lib/emails/layout";
import { appointments, services, shopStaff, shops } from "@/lib/db/schema";
import { sendBookingConfirmedEmail, sendBookingEmails } from "@/lib/emails/booking";
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
  clientEmail: z
    .string()
    .min(1, "El correo es obligatorio")
    .email("Correo electrónico inválido"),
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
  const clientEmail = data.clientEmail.trim().toLowerCase();
  const clientId = await tryLinkShopClient(db, shop.id, {
    name: data.clientName,
    phone: data.clientPhone,
    email: clientEmail,
  });

  const appointment = await insertAppointmentRow(db, {
    shopId: shop.id,
    ...(clientId ? { clientId } : {}),
    serviceId: data.serviceId,
    staffMemberId,
    staffPreference: data.preference,
    status: "pending",
    source: "online",
    clientName: data.clientName.trim(),
    clientPhone: data.clientPhone.trim(),
    clientEmail,
    startAt,
    endAt,
  });

  const staff = ctx.staff.find((s) => s.id === staffMemberId);
  try {
    await sendBookingEmails({
      shop,
      appointment,
      staffName: staff?.displayName ?? "Barbero",
      serviceName: service.name,
    });
  } catch (err) {
    console.error("[booking] email failed", err);
  }

  try {
    await sendPushToShopTeam(shop.id, shop.ownerUserId, {
      title: "Nueva reserva pendiente",
      body: `${data.clientName} — ${service.name}`,
      url: `/dashboard/reservas?highlight=${appointment.id}`,
    });
  } catch (err) {
    console.error("[booking] push failed", err);
  }

  revalidatePath(`/${shop.slug}`);
  revalidatePath("/dashboard/reservas");
  return { id: appointment.id };
}

export async function getPublicBookingConfirmation(slug: string, appointmentId: string) {
  const shop = await getShopBySlug(slug);
  if (!shop || !isShopPubliclyAccessible(shop)) return null;

  const db = requireDb();
  const [row] = await db
    .select({
      id: appointments.id,
      clientName: appointments.clientName,
      clientPhone: appointments.clientPhone,
      clientEmail: appointments.clientEmail,
      startAt: appointments.startAt,
      status: appointments.status,
      serviceName: services.name,
      staffName: shopStaff.displayName,
    })
    .from(appointments)
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .innerJoin(shopStaff, eq(shopStaff.id, appointments.staffMemberId))
    .where(
      and(eq(appointments.id, appointmentId), eq(appointments.shopId, shop.id)),
    )
    .limit(1);

  if (!row || !row.clientEmail) return null;

  return {
    shopName: shop.name,
    timezone: shop.timezone,
    slug: shop.slug,
    serviceName: row.serviceName,
    staffName: row.staffName,
    clientName: row.clientName,
    clientPhone: row.clientPhone,
    clientEmail: row.clientEmail,
    startAt: row.startAt.toISOString(),
    status: String(row.status),
  };
}

export async function getAppointmentCancelPreview(slug: string, token: string) {
  const appointmentId = verifyAppointmentCancelToken(token);
  if (!appointmentId) return null;

  const shop = await getShopBySlug(slug);
  if (!shop) return null;

  const db = requireDb();
  const [row] = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      startAt: appointments.startAt,
      shopId: appointments.shopId,
      serviceName: services.name,
    })
    .from(appointments)
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!row || row.shopId !== shop.id) return null;
  if (row.status !== "pending" && row.status !== "confirmed") return null;
  if (row.startAt.getTime() <= Date.now()) return null;

  return {
    shopName: shop.name,
    serviceName: row.serviceName,
    when: formatDateTime(row.startAt, shop.timezone),
  };
}

export async function cancelPublicAppointment(token: string) {
  const appointmentId = verifyAppointmentCancelToken(token);
  if (!appointmentId) {
    throw new Error("Enlace de cancelación inválido o expirado");
  }

  const db = requireDb();
  const [appt] = await db
    .select({
      id: appointments.id,
      shopId: appointments.shopId,
      status: appointments.status,
      startAt: appointments.startAt,
    })
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!appt) throw new Error("Cita no encontrada");
  if (appt.status !== "pending" && appt.status !== "confirmed") {
    throw new Error("Esta cita ya no se puede cancelar");
  }
  if (appt.startAt.getTime() <= Date.now()) {
    throw new Error("No puedes cancelar una cita que ya pasó");
  }

  await db
    .update(appointments)
    .set({
      status: "cancelled",
      cancellationReason: "Cancelada por el cliente",
    })
    .where(eq(appointments.id, appointmentId));

  const [shopRow] = await db
    .select({ slug: shops.slug })
    .from(shops)
    .where(eq(shops.id, appt.shopId))
    .limit(1);

  if (shopRow?.slug) {
    revalidatePath(`/${shopRow.slug}`);
    revalidatePath("/dashboard/reservas");
    revalidatePath("/dashboard/calendario");
  }

  return { ok: true as const };
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

  const clientEmail = data.clientEmail?.trim().toLowerCase() || null;
  const clientId = await tryLinkShopClient(db, shop.id, {
    name: data.clientName,
    phone: data.clientPhone,
    email: clientEmail,
  });

  const appointment = await insertAppointmentRow(db, {
    shopId: shop.id,
    ...(clientId ? { clientId } : {}),
    serviceId: data.serviceId,
    staffMemberId: data.staffMemberId,
    staffPreference: "specific",
    status: data.status,
    source: "manual",
    clientName: data.clientName.trim(),
    clientPhone: data.clientPhone.trim(),
    clientEmail,
    notes: data.notes || null,
    startAt,
    endAt,
    approvedAt: data.status === "confirmed" ? new Date() : null,
    approvedByUserId:
      data.status === "confirmed" ? session.user.id : null,
  });

  revalidatePath("/dashboard/reservas");
  revalidatePath("/dashboard/calendario");
  revalidatePath(`/${shop.slug}`);
  return { id: appointment.id };
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

  const [service] = await db
    .select({ name: services.name })
    .from(services)
    .where(eq(services.id, appt.serviceId))
    .limit(1);

  const [staff] = await db
    .select({ displayName: shopStaff.displayName })
    .from(shopStaff)
    .where(eq(shopStaff.id, appt.staffMemberId))
    .limit(1);

  if (service && staff) {
    try {
      await sendBookingConfirmedEmail({
        shop,
        appointment: {
          id: appt.id,
          clientName: appt.clientName,
          clientEmail: appt.clientEmail,
          startAt: appt.startAt,
        },
        serviceName: service.name,
        staffName: staff.displayName,
      });
    } catch (err) {
      console.error("[approveAppointment] confirmation email failed", err);
    }
  }

  revalidatePath("/dashboard/reservas");
  revalidatePath("/dashboard/calendario");
  revalidatePath(`/${shop.slug}`);

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
