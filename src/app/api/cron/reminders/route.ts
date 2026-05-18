import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify";
import { requireDb } from "@/lib/db";
import { appointments, services, shopStaff, shops } from "@/lib/db/schema";
import { appointmentReminderEmailHtml } from "@/lib/emails/templates/appointment-reminder";
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
      staffName: shopStaff.displayName,
    })
    .from(appointments)
    .innerJoin(shops, eq(appointments.shopId, shops.id))
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(shopStaff, eq(appointments.staffMemberId, shopStaff.id))
    .where(
      and(
        eq(appointments.status, "confirmed"),
        gte(appointments.startAt, in24h),
        lte(appointments.startAt, in25h),
        isNull(appointments.reminderSentAt),
      ),
    );

  let sent = 0;

  for (const { appointment, shop, serviceName, staffName } of upcoming) {
    if (!appointment.clientEmail) continue;

    const address = shop.formattedAddress ?? shop.addressLine1 ?? null;

    await sendEmail({
      to: appointment.clientEmail,
      subject: `Recordatorio: tu cita mañana — ${shop.name}`,
      html: appointmentReminderEmailHtml({
        clientName: appointment.clientName,
        shopName: shop.name,
        shopSlug: shop.slug,
        serviceName,
        staffName,
        startAt: appointment.startAt,
        timezone: shop.timezone,
        shopAddress: address,
      }),
    });

    await db
      .update(appointments)
      .set({ reminderSentAt: new Date() })
      .where(eq(appointments.id, appointment.id));

    sent++;
  }

  return NextResponse.json({ sent });
}
