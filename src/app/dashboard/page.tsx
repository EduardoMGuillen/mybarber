import Link from "next/link";
import { auth } from "@/lib/auth";
import { getShopForUser } from "@/lib/tenant";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Panel" };

export default async function DashboardPage() {
  const session = await auth();
  const shop = session?.user?.id
    ? await getShopForUser(session.user.id, session.user.role ?? "owner")
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Hola, {session?.user?.name ?? "Barbero"}
        </h1>
        <p className="text-brand-text-muted">
          {shop
            ? `Gestiona ${shop.name} desde el menú lateral.`
            : "Configura tu barbería para activar reservas y tu landing pública."}
        </p>
      </div>

      {!shop ? (
        <div className="rounded-xl border border-brand-gold/30 bg-brand-gold/10 p-6">
          <h2 className="font-semibold text-brand-gold">Primer paso</h2>
          <p className="mt-2 text-sm text-brand-text-muted">
            Completa perfil, servicios y ubicación. El menú de la izquierda te
            acompaña en todo momento.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/configuracion/perfil">Configurar barbería</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/dashboard/reservas", label: "Reservas", desc: "Aprobar y gestionar citas" },
            { href: "/dashboard/calendario", label: "Calendario", desc: "Vista semanal" },
            { href: "/dashboard/enlace", label: "Mi enlace", desc: "URL y código QR" },
            { href: "/dashboard/configuracion/perfil", label: "Perfil", desc: "Datos del negocio" },
            { href: "/dashboard/configuracion/servicios", label: "Servicios", desc: "Precios y duración" },
            { href: "/dashboard/facturacion", label: "Facturación", desc: "Trial y PayPal" },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-xl border border-white/10 bg-brand-surface p-5 transition hover:border-brand-gold/30 hover:bg-white/[0.02]"
            >
              <p className="font-semibold text-brand-gold">{card.label}</p>
              <p className="mt-1 text-sm text-brand-text-muted">{card.desc}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
