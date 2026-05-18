import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify";
import { requireDb } from "@/lib/db";
import { appointments, services, shops } from "@/lib/db/schema";
import { sendEmail } from "@/lib/resend/client";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = requireDb();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const upcoming = await db
    .select({
      appointment: appointments,
      shop: shops,
      serviceName: services.name,
    })
    .from(appointments)
    .innerJoin(shops, eq(appointments.shopId, shops.id))
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        eq(appointments.status, "confirmed"),
        gte(appointments.startAt, in24h),
        lte(appointments.startAt, in25h),
        isNull(appointments.reminderSentAt),
      ),
    );

  let sent = 0;

  for (const { appointment, shop, serviceName } of upcoming) {
    if (!appointment.clientEmail) continue;

    const when = appointment.startAt.toLocaleString("es-HN", {
      timeZone: shop.timezone,
    });

    await sendEmail({
      to: appointment.clientEmail,
      subject: `Recordatorio de cita — ${shop.name}`,
      html: `
        <div style="font-family:sans-serif;background:#0a0a0a;color:#f5f5f5;padding:24px">
          <h1 style="color:#c9a227">Tu cita es mañana</h1>
          <p>Hola ${appointment.clientName},</p>
          <p>Te recordamos tu cita en <strong>${shop.name}</strong>.</p>
          <p><strong>Servicio:</strong> ${serviceName}<br/>
          <strong>Cuándo:</strong> ${when}</p>
        </div>
      `,
    });

    await db
      .update(appointments)
      .set({ reminderSentAt: new Date() })
      .where(eq(appointments.id, appointment.id));

    sent++;
  }

  return NextResponse.json({ sent });
}
