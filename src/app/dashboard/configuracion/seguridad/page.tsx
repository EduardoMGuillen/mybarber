import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ConfigNav } from "@/components/dashboard/config-nav";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Seguridad" };

export default async function SeguridadPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div>
      <ConfigNav current="/dashboard/configuracion/seguridad" />
      <h1 className="mb-6 text-2xl font-bold">Seguridad</h1>

      <div className="max-w-lg space-y-6 rounded-xl border border-white/10 bg-brand-surface p-6">
        <section className="space-y-2">
          <h2 className="font-semibold text-brand-gold">Contraseña</h2>
          <p className="text-sm text-brand-text-muted">
            Cambiar contraseña desde el panel estará disponible pronto. Por ahora
            usa el flujo de recuperación por correo.
          </p>
          <Button asChild variant="outline">
            <Link href="/olvide-contrasena">Restablecer contraseña por email</Link>
          </Button>
        </section>

        <section className="space-y-2 border-t border-white/10 pt-6">
          <h2 className="font-semibold text-brand-gold">Sesión</h2>
          <p className="text-sm text-brand-text-muted">
            Si iniciaste con Google, la contraseña no aplica a esa cuenta.
          </p>
        </section>
      </div>
    </div>
  );
}
