import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { DEFAULT_VAPID_SUBJECT } from "@/lib/constants";
import { requireDb } from "@/lib/db";
import { shopStaff, userPreferences } from "@/lib/db/schema";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

function configureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? DEFAULT_VAPID_SUBJECT;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPushToShopTeam(
  shopId: string,
  ownerUserId: string,
  payload: PushPayload,
) {
  if (!configureVapid()) return;

  const db = requireDb();
  const staffRows = await db
    .select({ userId: shopStaff.userId })
    .from(shopStaff)
    .where(eq(shopStaff.shopId, shopId));

  const userIds = new Set<string>([ownerUserId]);
  for (const row of staffRows) {
    if (row.userId) userIds.add(row.userId);
  }

  if (userIds.size === 0) return;

  const prefs = await db
    .select({
      userId: userPreferences.userId,
      pushEnabled: userPreferences.pushEnabled,
      pushSubscription: userPreferences.pushSubscription,
    })
    .from(userPreferences)
    .where(inArray(userPreferences.userId, [...userIds]));

  const body = JSON.stringify(payload);

  await Promise.allSettled(
    prefs
      .filter((p) => p.pushEnabled && p.pushSubscription)
      .map((p) =>
        webpush.sendNotification(
          p.pushSubscription as webpush.PushSubscription,
          body,
        ),
      ),
  );
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configureVapid()) return;

  const db = requireDb();
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (!prefs?.pushEnabled || !prefs.pushSubscription) return;

  await webpush.sendNotification(
    prefs.pushSubscription as webpush.PushSubscription,
    JSON.stringify(payload),
  );
}
