import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listServicesForShop } from "@/lib/actions/services";
import { getShopForUser } from "@/lib/tenant";
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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <p className="text-brand-text-muted">
          <Link href="/dashboard/configuracion/perfil" className="text-brand-gold hover:underline">
            Configura tu barbería
          </Link>{" "}
          primero.
        </p>
      </div>
    );
  }

  const services = await listServicesForShop(shop.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Servicios</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Precios y duración que ven tus clientes al reservar.
        </p>
      </div>
      <ServicesManager services={services} />
    </div>
  );
}
