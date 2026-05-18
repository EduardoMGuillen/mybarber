import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const subscription = subscriptionSchema.safeParse(body);
  if (!subscription.success) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  }

  const db = requireDb();
  await db
    .insert(userPreferences)
    .values({
      userId: session.user.id,
      pushEnabled: true,
      pushSubscription: subscription.data,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        pushEnabled: true,
        pushSubscription: subscription.data,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = requireDb();
  await db
    .insert(userPreferences)
    .values({
      userId: session.user.id,
      pushEnabled: false,
      pushSubscription: null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        pushEnabled: false,
        pushSubscription: null,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}
