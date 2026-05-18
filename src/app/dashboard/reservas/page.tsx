import { redirect } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import {
  appointments,
  services,
  shopStaff,
} from "@/lib/db/schema";
import { getShopForUser } from "@/lib/tenant";
import { ReservasList } from "@/components/dashboard/reservas-list";

export const metadata = { title: "Reservas" };

export default async function ReservasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shop = await getShopForUser(
    session.user.id,
    session.user.role ?? "owner",
  );
  if (!shop) {
    return (
      <p className="text-brand-text-muted">
        Configura tu barbería en onboarding primero.
      </p>
    );
  }

  const db = requireDb();
  const rows = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      clientName: appointments.clientName,
      clientPhone: appointments.clientPhone,
      startAt: appointments.startAt,
      staffMemberId: appointments.staffMemberId,
      serviceName: services.name,
      staffName: shopStaff.displayName,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(shopStaff, eq(appointments.staffMemberId, shopStaff.id))
    .where(
      and(
        eq(appointments.shopId, shop.id),
        inArray(appointments.status, ["pending", "confirmed"]),
      ),
    )
    .orderBy(asc(appointments.startAt));

  const staff = await db
    .select({ id: shopStaff.id, displayName: shopStaff.displayName })
    .from(shopStaff)
    .where(and(eq(shopStaff.shopId, shop.id), eq(shopStaff.active, true)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reservas</h1>
        <p className="text-brand-text-muted">
          Pendientes y confirmadas — aprueba o rechaza solicitudes.
        </p>
      </div>
      <ReservasList
        appointments={rows.map((r) => ({
          ...r,
          startAt: r.startAt.toISOString(),
        }))}
        staff={staff}
        canReassign={session.user.role === "owner"}
      />
    </div>
  );
}
