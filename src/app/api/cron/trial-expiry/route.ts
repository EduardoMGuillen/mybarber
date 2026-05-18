import { and, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify";
import { requireDb } from "@/lib/db";
import { shops } from "@/lib/db/schema";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = requireDb();
  const now = new Date();

  const expired = await db
    .update(shops)
    .set({ status: "suspended", updatedAt: now })
    .where(
      and(
        eq(shops.status, "trial"),
        lt(shops.trialEndsAt, now),
        eq(shops.billingExempt, false),
      ),
    )
    .returning({ id: shops.id });

  return NextResponse.json({ updated: expired.length });
}
