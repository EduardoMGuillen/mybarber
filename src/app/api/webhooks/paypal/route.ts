import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { shops, subscriptionEvents } from "@/lib/db/schema";

export async function POST(req: Request) {
  const body = await req.json();
  const eventType = body.event_type as string;
  const resource = body.resource ?? {};
  const paypalEventId = body.id as string;

  if (!paypalEventId) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const db = requireDb();

  const [existing] = await db
    .select()
    .from(subscriptionEvents)
    .where(eq(subscriptionEvents.paypalEventId, paypalEventId))
    .limit(1);

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const subscriptionId =
    resource.id ?? resource.billing_agreement_id ?? body.resource?.id;

  let shopId: string | null = null;
  if (subscriptionId) {
    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.subscriptionId, subscriptionId))
      .limit(1);
    shopId = shop?.id ?? null;
  }

  if (shopId) {
    await db.insert(subscriptionEvents).values({
      shopId,
      eventType,
      paypalEventId,
      rawJson: body,
    });

    if (
      eventType === "BILLING.SUBSCRIPTION.ACTIVATED" ||
      eventType === "PAYMENT.SALE.COMPLETED"
    ) {
      await db
        .update(shops)
        .set({ status: "active", subscriptionStatus: "active", updatedAt: new Date() })
        .where(eq(shops.id, shopId));
    }

    if (
      eventType === "BILLING.SUBSCRIPTION.CANCELLED" ||
      eventType === "BILLING.SUBSCRIPTION.SUSPENDED" ||
      eventType === "BILLING.SUBSCRIPTION.EXPIRED"
    ) {
      await db
        .update(shops)
        .set({ status: "suspended", subscriptionStatus: eventType, updatedAt: new Date() })
        .where(eq(shops.id, shopId));
    }
  }

  return NextResponse.json({ ok: true });
}
