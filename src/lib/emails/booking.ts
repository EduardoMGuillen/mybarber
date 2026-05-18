import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { shopStaff, users, userPreferences } from "@/lib/db/schema";
import { sendEmail } from "@/lib/resend/client";
import type { ShopRow } from "@/lib/tenant";

type Appointment = {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  startAt: Date;
  staffMemberId: string;
};

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const when = new Date(appointment.startAt).toLocaleString("es-HN", {
    timeZone: shop.timezone,
  });

  if (!appointment.clientEmail) {
    throw new Error("Correo del cliente requerido para enviar la confirmación");
  }

  await sendEmail({
      to: appointment.clientEmail,
      subject: `Solicitud recibida — ${shop.name}`,
      html: `
        <div style="font-family:sans-serif;background:#0a0a0a;color:#f5f5f5;padding:24px">
          <h1 style="color:#c9a227">Solicitud de reserva</h1>
          <p>Hola ${appointment.clientName}, recibimos tu solicitud en <strong>${shop.name}</strong>.</p>
          <p><strong>Servicio:</strong> ${serviceName}<br/>
          <strong>Barbero:</strong> ${staffName}<br/>
          <strong>Fecha:</strong> ${when}</p>
          <p style="color:#a3a3a3">Tu cita queda <strong>pendiente de confirmación</strong>. Te avisaremos por correo cuando el barbero la apruebe.</p>
          <p style="color:#a3a3a3;margin-top:16px">Guarda este correo como comprobante de tu reserva.</p>
        </div>
      `,
  });

  const db = requireDb();
  const [staff] = await db
    .select({ userId: shopStaff.userId })
    .from(shopStaff)
    .where(eq(shopStaff.id, appointment.staffMemberId))
    .limit(1);

  const notifyEmails: string[] = [];

  if (staff?.userId) {
    const [staffUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, staff.userId))
      .limit(1);
    if (staffUser?.email) {
      const [prefs] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, staff.userId))
        .limit(1);
      if (prefs?.emailNewBooking !== false) {
        notifyEmails.push(staffUser.email);
      }
    }
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.id, shop.ownerUserId))
    .limit(1);

  if (owner?.email && !notifyEmails.includes(owner.email)) {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, shop.ownerUserId))
      .limit(1);
    if (prefs?.emailNewBooking !== false) {
      notifyEmails.push(owner.email);
    }
  }

  for (const to of notifyEmails) {
    await sendEmail({
      to,
      subject: `Nueva reserva pendiente — ${appointment.clientName}`,
      html: `
        <div style="font-family:sans-serif;background:#0a0a0a;color:#f5f5f5;padding:24px">
          <h1 style="color:#c9a227">Nueva solicitud</h1>
          <p><strong>${appointment.clientName}</strong> — ${appointment.clientPhone}</p>
          <p>${serviceName} con ${staffName} — ${when}</p>
          <p><a href="${appUrl}/dashboard/reservas?highlight=${appointment.id}" style="color:#c9a227">Ver en el panel</a></p>
        </div>
      `,
    });
  }
}
