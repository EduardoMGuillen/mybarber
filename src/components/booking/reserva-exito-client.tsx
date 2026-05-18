"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookingConfirmationCard } from "@/components/booking/booking-confirmation-card";
import { Button } from "@/components/ui/button";
import { getPublicBookingConfirmation } from "@/lib/actions/appointments";

type BookingData = {
  shopName: string;
  serviceName: string;
  staffName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  startAt: string;
  timezone: string;
  status: string;
};

export function ReservaExitoClient({
  slug,
  appointmentId,
}: {
  slug: string;
  appointmentId?: string;
}) {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loaded, setLoaded] = useState(!appointmentId);

  useEffect(() => {
    if (!appointmentId) return;

    let cancelled = false;
    getPublicBookingConfirmation(slug, appointmentId)
      .then((data) => {
        if (cancelled || !data?.clientEmail) return;
        setBooking({
          shopName: data.shopName,
          serviceName: data.serviceName,
          staffName: data.staffName,
          clientName: data.clientName,
          clientPhone: data.clientPhone,
          clientEmail: data.clientEmail,
          startAt: data.startAt,
          timezone: data.timezone,
          status: data.status,
        });
      })
      .catch((err) => {
        console.error("[reserva-exito]", err);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, appointmentId]);

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
          <BookingConfirmationCard data={booking} />
        </div>
      ) : loaded && appointmentId ? (
        <p className="mt-6 text-sm text-brand-text-muted">
          Si no ves el comprobante, revisa tu bandeja de correo.
        </p>
      ) : appointmentId ? (
        <p className="mt-6 text-sm text-brand-text-muted">Cargando comprobante…</p>
      ) : null}

      <Button asChild className="mt-8 print:hidden">
        <Link href={`/${slug}`}>Volver a la barbería</Link>
      </Button>
    </div>
  );
}
