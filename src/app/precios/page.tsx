import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Precios" };

export default function PreciosPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-white/10 px-4 py-4">
        <BrandLogo href="/" />
      </header>
      <main className="mx-auto max-w-lg flex-1 px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">$20 USD / mes</h1>
        <p className="mt-4 text-brand-text-muted">
          7 días de prueba gratis. Landing con SEO, reservas multi-barbero y panel
          PWA.
        </p>
        <Button asChild className="mt-8">
          <Link href="/registro">Empezar prueba</Link>
        </Button>
      </main>
    </div>
  );
}
