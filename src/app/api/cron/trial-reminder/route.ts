import { and, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify";
import { requireDb } from "@/lib/db";
import { shops, userPreferences, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/resend/client";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = requireDb();
  const now = new Date();
  const inTwoDays = new Date(now);
  inTwoDays.setDate(inTwoDays.getDate() + 2);
  const inThreeDays = new Date(now);
  inThreeDays.setDate(inThreeDays.getDate() + 3);

  const expiring = await db
    .select({
      shopName: shops.name,
      trialEndsAt: shops.trialEndsAt,
      ownerEmail: users.email,
      ownerName: users.name,
      emailTrialReminders: userPreferences.emailTrialReminders,
    })
    .from(shops)
    .innerJoin(users, eq(shops.ownerUserId, users.id))
    .leftJoin(userPreferences, eq(userPreferences.userId, users.id))
    .where(
      and(
        eq(shops.status, "trial"),
        gte(shops.trialEndsAt, inTwoDays),
        lte(shops.trialEndsAt, inThreeDays),
        eq(shops.billingExempt, false),
      ),
    );

  let sent = 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  for (const row of expiring) {
    if (row.emailTrialReminders === false) continue;
    if (!row.ownerEmail) continue;

    await sendEmail({
      to: row.ownerEmail,
      subject: `Tu prueba termina pronto — ${row.shopName}`,
      html: `
        <div style="font-family:sans-serif;background:#0a0a0a;color:#f5f5f5;padding:24px">
          <h1 style="color:#c9a227">Prueba por terminar</h1>
          <p>Hola ${row.ownerName ?? "barbero"},</p>
          <p>La prueba de <strong>${row.shopName}</strong> termina el ${row.trialEndsAt.toLocaleDateString("es-HN")}.</p>
          <p><a href="${appUrl}/dashboard/facturacion" style="color:#c9a227">Activar suscripción</a></p>
        </div>
      `,
    });
    sent++;
  }

  return NextResponse.json({ reminded: sent });
}
