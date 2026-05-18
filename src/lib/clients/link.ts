import type { Db } from "@/lib/db";
import { appointments } from "@/lib/db/schema";
import { type ClientInput, upsertShopClient } from "@/lib/clients/upsert";

type AppointmentInsert = typeof appointments.$inferInsert;
type AppointmentRow = typeof appointments.$inferSelect;

/** Postgres: undefined_table | undefined_column */
export function isClientsSchemaMissing(err: unknown): boolean {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: string }).code)
      : "";
  return code === "42P01" || code === "42703";
}

/** Vincula cliente si la tabla existe; si no, devuelve null (cita sigue con datos en appointments). */
export async function tryLinkShopClient(
  db: Db,
  shopId: string,
  input: ClientInput,
): Promise<string | null> {
  try {
    return await upsertShopClient(db, shopId, input);
  } catch (err) {
    if (isClientsSchemaMissing(err)) {
      console.warn("[clients] CRM no disponible aún; reserva sin client_id");
      return null;
    }
    throw err;
  }
}

/** Inserta cita; reintenta sin client_id si la migración aún no está en producción. */
export async function insertAppointmentRow(
  db: Db,
  values: AppointmentInsert,
): Promise<AppointmentRow> {
  const attempt = async (row: AppointmentInsert) => {
    const [created] = await db.insert(appointments).values(row).returning();
    if (!created) throw new Error("No se pudo crear la cita");
    return created;
  };

  try {
    return await attempt(values);
  } catch (err) {
    if (!isClientsSchemaMissing(err) || values.clientId == null) throw err;
    const { clientId: _removed, ...withoutClient } = values;
    return await attempt(withoutClient as AppointmentInsert);
  }
}
