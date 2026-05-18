import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { shopStaff } from "@/lib/db/schema";
import { getShopForUser } from "@/lib/tenant";
import { TeamManager } from "./team-manager";

export const metadata = { title: "Equipo" };

export default async function EquipoPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "owner") redirect("/dashboard");

  const shop = await getShopForUser(session.user.id, "owner");
  if (!shop) redirect("/dashboard/configuracion/perfil");

  const db = requireDb();
  const team = await db
    .select()
    .from(shopStaff)
    .where(eq(shopStaff.shopId, shop.id))
    .orderBy(shopStaff.sortOrder);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Equipo</h1>
        <p className="text-brand-text-muted">
          Barberos que aparecen en la reserva pública
        </p>
      </div>
      <TeamManager initialTeam={team} />
    </div>
  );
}
