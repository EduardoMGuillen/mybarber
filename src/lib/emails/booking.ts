import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { shopStaff, users, userPreferences } from "@/lib/db/schema";
import { sendEmail } from "@/lib/resend/client";
import { buildAppointmentCancelUrl } from "@/lib/appointments/cancel-token";
import { bookingClientConfirmedEmailHtml, bookingClientEmailHtml } from "@/lib/emails/templates/booking-client";
import { bookingShopEmailHtml } from "@/lib/emails/templates/booking-shop";
import type { ShopRow } from "@/lib/tenant";

type Appointment = {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  startAt: Date;
  staffMemberId: string;
};

type ShopNotifyRecipient = {
  email: string;
  name: string | null;
};

async function getShopBookingNotifyRecipients(
  shop: ShopRow,
  staffMemberId: string,
): Promise<ShopNotifyRecipient[]> {
  const db = requireDb();
  const byEmail = new Map<string, ShopNotifyRecipient>();

  const [owner] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, shop.ownerUserId))
    .limit(1);

  if (owner?.email) {
    const [ownerPrefs] = await db
      .select({ emailNewBooking: userPreferences.emailNewBooking })
      .from(userPreferences)
      .where(eq(userPreferences.userId, shop.ownerUserId))
      .limit(1);

    if (ownerPrefs?.emailNewBooking !== false) {
      byEmail.set(owner.email, { email: owner.email, name: owner.name });
    }
  }

  const [staff] = await db
    .select({ userId: shopStaff.userId })
    .from(shopStaff)
    .where(eq(shopStaff.id, staffMemberId))
    .limit(1);

  if (staff?.userId) {
    const [staffUser] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, staff.userId))
      .limit(1);

    if (staffUser?.email) {
      const [prefs] = await db
        .select({ emailNewBooking: userPreferences.emailNewBooking })
        .from(userPreferences)
        .where(eq(userPreferences.userId, staff.userId))
        .limit(1);

      if (prefs?.emailNewBooking !== false) {
        byEmail.set(staffUser.email, {
          email: staffUser.email,
          name: staffUser.name,
        });
      }
    }
  }

  return Array.from(byEmail.values());
}

export async function sendBookingEmails({
  shop,
  appointment,
  staffName,
  serviceName,
}: {
  shop: ShopRow;
  appointment: Appointment;
  staffName: string;
  serviceName: string;
}) {
  if (!appointment.clientEmail) {
    throw new Error("Correo del cliente requerido para enviar la confirmación");
  }

  const address = shop.formattedAddress ?? shop.addressLine1 ?? null;
  const cancelUrl = buildAppointmentCancelUrl(shop.slug, appointment.id);

  await sendEmail({
    to: appointment.clientEmail,
    subject: `Solicitud recibida — ${shop.name}`,
    html: bookingClientEmailHtml({
      clientName: appointment.clientName,
      shopName: shop.name,
      shopSlug: shop.slug,
      serviceName,
      staffName,
      startAt: appointment.startAt,
      timezone: shop.timezone,
      shopAddress: address,
      cancelUrl,
    }),
  });

  const recipients = await getShopBookingNotifyRecipients(
    shop,
    appointment.staffMemberId,
  );

  for (const recipient of recipients) {
    await sendEmail({
      to: recipient.email,
      subject: `Nueva reserva — ${appointment.clientName} · ${shop.name}`,
      html: bookingShopEmailHtml({
        shopName: shop.name,
        appointmentId: appointment.id,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        clientEmail: appointment.clientEmail,
        serviceName,
        staffName,
        startAt: appointment.startAt,
        timezone: shop.timezone,
        recipientName: recipient.name,
      }),
    });
  }
}

export async function sendBookingConfirmedEmail({
  shop,
  appointment,
  staffName,
  serviceName,
}: {
  shop: ShopRow;
  appointment: Pick<Appointment, "id" | "clientName" | "clientEmail" | "startAt">;
  staffName: string;
  serviceName: string;
}) {
  if (!appointment.clientEmail) return;

  const cancelUrl = buildAppointmentCancelUrl(shop.slug, appointment.id);

  await sendEmail({
    to: appointment.clientEmail,
    subject: `Cita confirmada — ${shop.name}`,
    html: bookingClientConfirmedEmailHtml({
      clientName: appointment.clientName,
      shopName: shop.name,
      shopSlug: shop.slug,
      serviceName,
      staffName,
      startAt: appointment.startAt,
      timezone: shop.timezone,
      cancelUrl,
    }),
  });
}
