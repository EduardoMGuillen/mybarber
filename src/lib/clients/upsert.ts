import { and, eq } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { normalizeEmail, normalizePhone } from "@/lib/clients/normalize";

export type ClientInput = {
  name: string;
  phone: string;
  email?: string | null;
};

export async function upsertShopClient(
  db: Db,
  shopId: string,
  input: ClientInput,
): Promise<string> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const phoneNormalized = normalizePhone(phone);
  const emailNormalized = normalizeEmail(input.email);

  if (!name || name.length < 2) {
    throw new Error("Nombre de cliente inválido");
  }
  if (!phoneNormalized || phoneNormalized.length < 8) {
    throw new Error("Teléfono de cliente inválido");
  }

  let existing: typeof clients.$inferSelect | undefined;

  if (emailNormalized) {
    const [byEmail] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.shopId, shopId),
          eq(clients.emailNormalized, emailNormalized),
        ),
      )
      .limit(1);
    existing = byEmail;
  }

  if (!existing) {
    const [byPhone] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.shopId, shopId),
          eq(clients.phoneNormalized, phoneNormalized),
        ),
      )
      .limit(1);
    existing = byPhone;
  }

  const now = new Date();

  if (existing) {
    await db
      .update(clients)
      .set({
        name,
        phone,
        phoneNormalized,
        email: emailNormalized ?? existing.email,
        emailNormalized: emailNormalized ?? existing.emailNormalized,
        updatedAt: now,
      })
      .where(eq(clients.id, existing.id));

    return existing.id;
  }

  const [created] = await db
    .insert(clients)
    .values({
      shopId,
      name,
      phone,
      phoneNormalized,
      email: emailNormalized,
      emailNormalized,
    })
    .returning({ id: clients.id });

  if (!created) {
    throw new Error("No se pudo guardar el cliente");
  }

  return created.id;
}
