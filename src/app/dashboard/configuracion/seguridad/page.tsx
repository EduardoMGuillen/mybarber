import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Seguridad" };

export default async function SeguridadPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Seguridad</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Contraseña y acceso a tu cuenta.
        </p>
      </div>

      <div className="max-w-lg space-y-6 rounded-xl border border-white/10 bg-brand-surface p-6">
        <section className="space-y-2">
          <h2 className="font-semibold text-brand-gold">Contraseña</h2>
          <p className="text-sm text-brand-text-muted">
            Usa el flujo por correo para restablecer tu contraseña.
          </p>
          <Button asChild variant="outline">
            <Link href="/olvide-contrasena">Restablecer contraseña por email</Link>
          </Button>
        </section>

        <section className="space-y-2 border-t border-white/10 pt-6">
          <h2 className="font-semibold text-brand-gold">Cerrar sesión</h2>
          <p className="text-sm text-brand-text-muted">
            Usa el botón &quot;Cerrar sesión&quot; al final del menú lateral (escritorio o móvil).
          </p>
        </section>
      </div>
    </div>
  );
}
