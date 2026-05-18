import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listServicesForShop } from "@/lib/actions/services";
import { getShopForUser } from "@/lib/tenant";
import { ConfigNav } from "@/components/dashboard/config-nav";
import { ServicesManager } from "@/components/dashboard/services-manager";

export const metadata = { title: "Servicios" };

export default async function ServiciosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shop = await getShopForUser(
    session.user.id,
    session.user.role ?? "owner",
  );

  if (!shop) {
    return (
      <div>
        <ConfigNav current="/dashboard/configuracion/servicios" />
        <p className="text-brand-text-muted">Configura tu barbería primero.</p>
      </div>
    );
  }

  const services = await listServicesForShop(shop.id);

  return (
    <div>
      <ConfigNav current="/dashboard/configuracion/servicios" />
      <h1 className="mb-6 text-2xl font-bold">Servicios</h1>
      <ServicesManager services={services} />
    </div>
  );
}
