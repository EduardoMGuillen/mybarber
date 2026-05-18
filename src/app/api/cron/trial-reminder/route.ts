import { and, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify";
import { requireDb } from "@/lib/db";
import { shops, userPreferences, users } from "@/lib/db/schema";
import { trialReminderEmailHtml } from "@/lib/emails/templates/trial-reminder";
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

  for (const row of expiring) {
    if (row.emailTrialReminders === false) continue;
    if (!row.ownerEmail) continue;

    await sendEmail({
      to: row.ownerEmail,
      subject: `Tu prueba termina pronto — ${row.shopName}`,
      html: trialReminderEmailHtml({
        ownerName: row.ownerName,
        shopName: row.shopName,
        trialEndsAt: row.trialEndsAt,
      }),
    });
    sent++;
  }

  return NextResponse.json({ reminded: sent });
}
