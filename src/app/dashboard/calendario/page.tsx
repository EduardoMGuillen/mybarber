import { redirect } from "next/navigation";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { appointments, services, shopStaff } from "@/lib/db/schema";
import { getShopForUser } from "@/lib/tenant";

export const metadata = { title: "Calendario" };

export default async function CalendarioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shop = await getShopForUser(
    session.user.id,
    session.user.role ?? "owner",
  );
  if (!shop) {
    return (
      <p className="text-brand-text-muted">
        Configura tu barbería para ver el calendario.
      </p>
    );
  }

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const db = requireDb();
  const rows = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      clientName: appointments.clientName,
      startAt: appointments.startAt,
      serviceName: services.name,
      staffName: shopStaff.displayName,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(shopStaff, eq(appointments.staffMemberId, shopStaff.id))
    .where(
      and(
        eq(appointments.shopId, shop.id),
        gte(appointments.startAt, weekStart),
        lte(appointments.startAt, weekEnd),
      ),
    )
    .orderBy(asc(appointments.startAt));

  const byDay = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = format(row.startAt, "yyyy-MM-dd");
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(row);
  }

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario</h1>
        <p className="text-brand-text-muted">
          Semana del{" "}
          {format(weekStart, "d MMM", { locale: es })} al{" "}
          {format(weekEnd, "d MMM yyyy", { locale: es })}
        </p>
      </div>

      <div className="space-y-6">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayRows = byDay.get(key) ?? [];
          return (
            <section
              key={key}
              className="rounded-xl border border-white/10 bg-brand-surface p-4"
            >
              <h2 className="font-semibold text-brand-gold capitalize">
                {format(day, "EEEE d MMM", { locale: es })}
              </h2>
              {dayRows.length === 0 ? (
                <p className="mt-2 text-sm text-brand-text-muted">Sin citas</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {dayRows.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap justify-between gap-2 border-t border-white/5 pt-2 text-sm first:border-0 first:pt-0"
                    >
                      <span>
                        {format(r.startAt, "HH:mm")} — {r.clientName} ·{" "}
                        {r.serviceName} ({r.staffName})
                      </span>
                      <span className="text-brand-text-muted">{r.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
