import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SUPPORT_EMAIL } from "@/lib/constants";

export const metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-white/10 px-4 py-4">
        <BrandLogo href="/" />
      </header>
      <main className="mx-auto max-w-2xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold text-brand-gold">
          Política de privacidad
        </h1>
        <p className="mt-4 text-brand-text-muted text-sm">
          Última actualización: mayo 2026
        </p>
        <div className="mt-8 space-y-4 text-sm text-brand-text-muted">
          <p>
            Recopilamos datos de cuenta (correo, nombre), datos de tu barbería
            (ubicación, horarios, servicios) y datos de reservas (nombre y teléfono
            de clientes) para operar el servicio.
          </p>
          <p>
            Los correos transaccionales (confirmaciones, recordatorios) se envían
            mediante proveedores de email. No vendemos datos personales a terceros.
          </p>
          <p>
            Puedes solicitar acceso o eliminación de tu cuenta escribiendo a{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-gold">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <p>
            Usamos cookies de sesión y preferencias (idioma) para mejorar tu
            experiencia en el panel.
          </p>
        </div>
        <p className="mt-12">
          <Link href="/" className="text-brand-gold hover:underline">
            ← Inicio
          </Link>
        </p>
      </main>
    </div>
  );
}
