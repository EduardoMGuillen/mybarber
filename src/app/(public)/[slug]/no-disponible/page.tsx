import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { getShopBySlug } from "@/lib/tenant";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  return {
    title: shop ? `${shop.name} no disponible` : "No disponible",
  };
}

export default async function NoDisponiblePage({ params }: Props) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop) notFound();

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16 text-center">
      <BrandLogo size="md" href="/" />
      <h1 className="mt-8 text-2xl font-bold">{shop.name}</h1>
      <p className="mt-4 max-w-md text-brand-text-muted">
        Esta barbería no está aceptando reservas en línea en este momento. Puedes
        contactarlos directamente si tienes su número.
      </p>
      {shop.phone && (
        <p className="mt-4 text-sm">
          Teléfono:{" "}
          <a href={`tel:${shop.phone}`} className="text-brand-gold hover:underline">
            {shop.phone}
          </a>
        </p>
      )}
      <Button asChild variant="outline" className="mt-8">
        <Link href="/">Ir a MiBarbería</Link>
      </Button>
    </div>
  );
}
