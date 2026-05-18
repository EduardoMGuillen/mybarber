import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <BrandLogo size="md" />
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-brand-text-muted hover:text-brand-text"
            >
              Iniciar sesión
            </Link>
            <Button asChild>
              <Link href="/registro">Empezar gratis</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-brand-gold">
          Para barberías profesionales
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Tu barbería online con{" "}
          <span className="text-brand-gold">reservas en minutos</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-brand-text-muted">
          Landing con SEO, enlace de reservas, varios barberos y panel del día.
          Prueba 7 días gratis.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/registro">Crear mi barbería</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/precios">Ver precios</Link>
          </Button>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-brand-text-muted">
        © {new Date().getFullYear()} MiBarbería
      </footer>
    </div>
  );
}
