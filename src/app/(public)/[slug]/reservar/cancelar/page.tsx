import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelAppointmentForm } from "@/components/booking/cancel-appointment-form";
import { Button } from "@/components/ui/button";
import { getAppointmentCancelPreview } from "@/lib/actions/appointments";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string; done?: string }>;
};

export const metadata = { title: "Cancelar reserva" };

export default async function CancelarReservaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { t, done } = await searchParams;

  if (done === "1") {
    return (
      <div className="page-shell mx-auto max-w-lg px-4 py-12 pb-safe text-center">
        <h1 className="text-2xl font-bold text-brand-gold">Cita cancelada</h1>
        <p className="mt-3 text-sm text-brand-text-muted">
          Tu reserva fue cancelada. Si necesitas otra cita, puedes reservar de nuevo.
        </p>
        <Button asChild className="mt-8">
          <Link href={`/${slug}`}>Volver a la barbería</Link>
        </Button>
      </div>
    );
  }

  if (!t) notFound();

  const preview = await getAppointmentCancelPreview(slug, t);
  if (!preview) {
    return (
      <div className="page-shell mx-auto max-w-lg px-4 py-12 pb-safe text-center">
        <h1 className="text-2xl font-bold">No se puede cancelar</h1>
        <p className="mt-3 text-sm text-brand-text-muted">
          El enlace no es válido, la cita ya pasó o ya fue cancelada.
        </p>
        <Button asChild className="mt-8" variant="outline">
          <Link href={`/${slug}`}>Volver</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-lg px-4 py-12 pb-safe">
      <h1 className="text-center text-2xl font-bold">Cancelar reserva</h1>
      <p className="mt-2 text-center text-sm text-brand-text-muted">
        ¿Seguro que quieres cancelar esta cita en {preview.shopName}?
      </p>
      <div className="mt-8">
        <CancelAppointmentForm
          slug={slug}
          token={t}
          shopName={preview.shopName}
          serviceName={preview.serviceName}
          when={preview.when}
        />
      </div>
    </div>
  );
}
