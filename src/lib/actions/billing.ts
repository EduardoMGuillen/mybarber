"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { createSubscriptionApprovalUrl } from "@/lib/paypal/client";
import { getShopForUser } from "@/lib/tenant";

export async function startPayPalSubscription() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const shop = await getShopForUser(session.user.id, session.user.role ?? "owner");
  if (!shop) throw new Error("Sin barbería");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const result = await createSubscriptionApprovalUrl(
    `${appUrl}/dashboard/facturacion?success=1`,
    `${appUrl}/dashboard/facturacion?cancelled=1`,
  );

  if (!result) {
    throw new Error("PayPal no configurado. Añade PAYPAL_CLIENT_ID, SECRET y PLAN_ID.");
  }

  const db = requireDb();
  await db
    .update(shops)
    .set({ subscriptionId: result.subscriptionId, updatedAt: new Date() })
    .where(eq(shops.id, shop.id));

  return { url: result.url };
}
