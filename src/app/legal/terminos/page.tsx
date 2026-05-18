import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SUPPORT_EMAIL } from "@/lib/constants";

export const metadata = { title: "Términos de uso" };

export default function TerminosPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-white/10 px-4 py-4">
        <BrandLogo href="/" />
      </header>
      <main className="mx-auto max-w-2xl flex-1 px-4 py-12 prose prose-invert">
        <h1 className="text-3xl font-bold text-brand-gold">Términos de uso</h1>
        <p className="mt-4 text-brand-text-muted text-sm">
          Última actualización: mayo 2026
        </p>
        <div className="mt-8 space-y-4 text-sm text-brand-text-muted">
          <p>
            MiBarbería es una plataforma de reservas y presencia web para
            barberías. Al registrarte aceptas usar el servicio de forma lícita y
            proporcionar información veraz sobre tu negocio.
          </p>
          <p>
            Las suscripciones de prueba y de pago se rigen por el plan vigente en
            la página de precios. Nos reservamos el derecho de suspender cuentas
            que abusen del sistema o publiquen contenido engañoso.
          </p>
          <p>
            El contenido de tu landing (textos, imágenes, precios) es
            responsabilidad del titular de la barbería. MiBarbería no garantiza
            resultados comerciales específicos.
          </p>
          <p>
            Para consultas:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-gold">
              {SUPPORT_EMAIL}
            </a>
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
