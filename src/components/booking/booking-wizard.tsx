"use client";

import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPublicAppointment,
  getAvailableSlotsAction,
} from "@/lib/actions/appointments";
import type { Slot } from "@/lib/availability/engine";

export type BookingService = {
  id: string;
  name: string;
  durationMinutes: number;
  priceDisplay: string | null;
};

export type BookingStaff = {
  id: string;
  displayName: string;
};

type Props = {
  slug: string;
  shopName: string;
  timezone: string;
  services: BookingService[];
  staff: BookingStaff[];
};

type Step = "service" | "staff" | "datetime" | "client" | "done";

const ANY_STAFF = "__any__";

export function BookingWizard({
  slug,
  shopName,
  timezone,
  services,
  staff,
}: Props) {
  const router = useRouter();
  const needsStaffStep = staff.length >= 2;

  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState("");
  const [staffChoice, setStaffChoice] = useState(
    staff.length === 1 ? staff[0]!.id : ANY_STAFF,
  );
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const preference = staffChoice === ANY_STAFF ? "any" : "specific";
  const staffMemberId =
    staffChoice === ANY_STAFF ? undefined : staffChoice;

  const selectedService = services.find((s) => s.id === serviceId);

  const minDate = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return format(d, "yyyy-MM-dd");
  }, []);

  useEffect(() => {
    if (step !== "datetime" || !serviceId || !date) return;

    let cancelled = false;
    setSlotsLoading(true);
    setSelectedSlot(null);

    getAvailableSlotsAction({
      slug,
      serviceId,
      dateFrom: date,
      dateTo: date,
      staffMemberId,
      preference,
    })
      .then((result) => {
        if (!cancelled) setSlots(result);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [step, slug, serviceId, date, staffMemberId, preference]);

  function goNext() {
    setError(null);
    if (step === "service") {
      if (!serviceId) {
        setError("Elige un servicio");
        return;
      }
      setStep(needsStaffStep ? "staff" : "datetime");
      return;
    }
    if (step === "staff") {
      setStep("datetime");
      return;
    }
    if (step === "datetime") {
      if (!selectedSlot) {
        setError("Elige un horario");
        return;
      }
      setStep("client");
    }
  }

  function goBack() {
    setError(null);
    if (step === "client") setStep("datetime");
    else if (step === "datetime") setStep(needsStaffStep ? "staff" : "service");
    else if (step === "staff") setStep("service");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !serviceId) return;

    setLoading(true);
    setError(null);

    try {
      await createPublicAppointment({
        slug,
        serviceId,
        staffMemberId:
          preference === "specific" ? staffMemberId : undefined,
        preference,
        startAt: selectedSlot.startAt,
        clientName,
        clientPhone,
        clientEmail,
      });
      router.push(`/${slug}/reservar/exito`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reservar");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-white/10 bg-brand-surface p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-brand-gold">¡Reserva enviada!</h2>
        <p className="text-sm text-brand-text-muted">
          {shopName} revisará tu cita y te confirmará pronto.
        </p>
        <Button asChild variant="outline">
          <Link href={`/${slug}`}>Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 text-xs text-brand-text-muted">
        {(["service", needsStaffStep && "staff", "datetime", "client"] as const)
          .filter(Boolean)
          .map((s, i) => (
            <span
              key={String(s)}
              className={
                step === s ? "text-brand-gold font-medium" : undefined
              }
            >
              {i + 1}.{" "}
              {s === "service"
                ? "Servicio"
                : s === "staff"
                  ? "Barbero"
                  : s === "datetime"
                    ? "Fecha"
                    : "Datos"}
            </span>
          ))}
      </div>

      {step === "service" && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Elige un servicio</h2>
          <div className="grid gap-3">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServiceId(s.id)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  serviceId === s.id
                    ? "border-brand-gold bg-brand-gold/10"
                    : "border-white/10 bg-brand-surface hover:border-white/20"
                }`}
              >
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-brand-text-muted">
                  {s.durationMinutes} min
                  {s.priceDisplay ? ` · ${s.priceDisplay}` : ""}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "staff" && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">¿Con quién?</h2>
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => setStaffChoice(ANY_STAFF)}
              className={`rounded-xl border p-4 text-left ${
                staffChoice === ANY_STAFF
                  ? "border-brand-gold bg-brand-gold/10"
                  : "border-white/10 bg-brand-surface"
              }`}
            >
              Cualquier barbero disponible
            </button>
            {staff.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setStaffChoice(m.id)}
                className={`rounded-xl border p-4 text-left ${
                  staffChoice === m.id
                    ? "border-brand-gold bg-brand-gold/10"
                    : "border-white/10 bg-brand-surface"
                }`}
              >
                {m.displayName}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "datetime" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Fecha y hora</h2>
          {selectedService && (
            <p className="text-sm text-brand-text-muted">
              {selectedService.name} · {selectedService.durationMinutes} min
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="date">Día</Label>
            <Input
              id="date"
              type="date"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          {date && (
            <div className="space-y-2">
              <Label>Horarios disponibles</Label>
              {slotsLoading ? (
                <p className="text-sm text-brand-text-muted">Cargando…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-brand-text-muted">
                  No hay horarios este día. Prueba otra fecha.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 min-[380px]:grid-cols-3 sm:grid-cols-4">
                  {slots.map((slot) => (
                    <button
                      key={slot.startAt}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg border px-2 py-2 text-sm ${
                        selectedSlot?.startAt === slot.startAt
                          ? "border-brand-gold bg-brand-gold/10"
                          : "border-white/10 bg-brand-surface"
                      }`}
                    >
                      {formatInTimeZone(
                        parseISO(slot.startAt),
                        timezone,
                        "HH:mm",
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {step === "client" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold">Tus datos</h2>
          {selectedSlot && (
            <p className="text-sm text-brand-text-muted">
              {formatInTimeZone(
                parseISO(selectedSlot.startAt),
                timezone,
                "EEEE d MMM · HH:mm",
              )}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="clientName">Nombre</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientPhone">Teléfono / WhatsApp</Label>
            <Input
              id="clientPhone"
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email (opcional)</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Reservando…" : "Confirmar reserva"}
          </Button>
        </form>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {step !== "client" && (
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {step !== "service" && (
            <Button type="button" variant="outline" onClick={goBack} className="w-full sm:w-auto">
              Atrás
            </Button>
          )}
          <Button type="button" onClick={goNext} className="w-full flex-1 sm:w-auto">
            Continuar
          </Button>
        </div>
      )}

      {step === "client" && (
        <Button type="button" variant="ghost" onClick={goBack}>
          Atrás
        </Button>
      )}
    </div>
  );
}
