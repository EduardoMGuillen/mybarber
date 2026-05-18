"use server";

import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { appointments, clients } from "@/lib/db/schema";
import { getShopForUser } from "@/lib/tenant";

export async function getShopClients() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "No autenticado" };
  }

  const shop = await getShopForUser(
    session.user.id,
    session.user.role ?? "owner",
  );
  if (!shop) {
    return { ok: false as const, error: "Sin barbería" };
  }

  const db = requireDb();
  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      email: clients.email,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
    })
    .from(clients)
    .where(eq(clients.shopId, shop.id))
    .orderBy(desc(clients.updatedAt));

  const counts = await db
    .select({
      clientId: appointments.clientId,
    })
    .from(appointments)
    .where(eq(appointments.shopId, shop.id));

  const visitCount = new Map<string, number>();
  for (const row of counts) {
    if (!row.clientId) continue;
    visitCount.set(row.clientId, (visitCount.get(row.clientId) ?? 0) + 1);
  }

  return {
    ok: true as const,
    clients: rows.map((c) => ({
      ...c,
      visitCount: visitCount.get(c.id) ?? 0,
    })),
  };
}
