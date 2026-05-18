import Link from "next/link";
import { BookingConfirmationCard } from "@/components/booking/booking-confirmation-card";
import { Button } from "@/components/ui/button";
import { getPublicBookingConfirmation } from "@/lib/actions/appointments";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function ReservaExitoPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { id } = await searchParams;

  let booking = null;
  if (id) {
    try {
      booking = await getPublicBookingConfirmation(slug, id);
    } catch (err) {
      console.error("[reserva-exito] confirmation load failed", err);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 pb-safe text-center">
      <h1 className="text-2xl font-bold text-brand-gold">¡Solicitud enviada!</h1>
      <p className="mt-3 text-sm text-brand-text-muted">
        {booking
          ? "Revisa tu correo, toma captura de tu reserva y guarda el comprobante abajo."
          : "Tu reserva está pendiente de confirmación. Te avisaremos por correo."}
      </p>

      {booking ? (
        <div className="mt-8">
          <BookingConfirmationCard
            data={{
              shopName: booking.shopName,
              serviceName: booking.serviceName,
              staffName: booking.staffName,
              clientName: booking.clientName,
              clientPhone: booking.clientPhone,
              clientEmail: booking.clientEmail!,
              startAt: booking.startAt,
              timezone: booking.timezone,
              status: booking.status,
            }}
          />
        </div>
      ) : null}

      <Button asChild className="mt-8 print:hidden">
        <Link href={`/${slug}`}>Volver a la barbería</Link>
      </Button>
    </div>
  );
}

