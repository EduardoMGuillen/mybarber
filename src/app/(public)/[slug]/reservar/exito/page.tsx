import Link from "next/link";
import { getShopBySlug } from "@/lib/tenant";
import { Button } from "@/components/ui/button";

export default async function ReservaExitoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-brand-gold">Solicitud enviada</h1>
      <p className="mt-4 max-w-md text-brand-text-muted">
        Tu reserva en <strong>{shop?.name ?? slug}</strong> está{" "}
        <strong>pendiente de confirmación</strong>. Te avisaremos por correo cuando el
        barbero la apruebe.
      </p>
      <Button asChild className="mt-8">
        <Link href={`/${slug}`}>Volver a la barbería</Link>
      </Button>
    </div>
  );
}
