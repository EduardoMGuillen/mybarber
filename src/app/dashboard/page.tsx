import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Panel" };

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Hola, {session?.user?.name ?? "Barbero"}
        </h1>
        <p className="text-brand-text-muted">
          Completa el onboarding para publicar tu landing y enlace de reservas.
        </p>
      </div>
      <div className="rounded-xl border border-brand-gold/30 bg-brand-gold/10 p-6">
        <h2 className="font-semibold text-brand-gold">Próximo paso</h2>
        <p className="mt-2 text-sm text-brand-text-muted">
          Configura tu barbería: ubicación, servicios y horarios para activar SEO y
          ubicación en el mapa.
        </p>
        <Button asChild className="mt-4">
          <Link href="/onboarding">Continuar configuración</Link>
        </Button>
      </div>
    </div>
  );
}
