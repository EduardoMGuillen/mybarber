"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createManualAppointment } from "@/lib/actions/appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ServiceOption = { id: string; name: string; durationMinutes: number };
type StaffOption = { id: string; displayName: string };

export function ManualBookingForm({
  services,
  staff,
}: {
  services: ServiceOption[];
  staff: StaffOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    serviceId: services[0]?.id ?? "",
    staffMemberId: staff[0]?.id ?? "",
    startAt: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    notes: "",
    status: "confirmed" as "pending" | "confirmed",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const iso = new Date(form.startAt).toISOString();
        await createManualAppointment({
          ...form,
          startAt: iso,
          clientEmail: form.clientEmail || undefined,
          notes: form.notes || undefined,
        });
        router.refresh();
        setForm((f) => ({
          ...f,
          clientName: "",
          clientPhone: "",
          clientEmail: "",
          notes: "",
          startAt: "",
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear cita");
      }
    });
  }

  if (!services.length || !staff.length) {
    return (
      <p className="rounded-xl border border-white/10 bg-brand-surface p-4 text-sm text-brand-text-muted">
        Añade al menos un servicio y un barbero activo para crear citas manuales.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-brand-gold/20 bg-brand-gold/5 p-4"
    >
      <h2 className="font-semibold text-brand-gold">Reserva manual</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Servicio</Label>
          <select
            className="w-full rounded-lg border border-white/10 bg-brand-surface px-3 py-2 text-sm"
            value={form.serviceId}
            onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
            required
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes} min)
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Barbero</Label>
          <select
            className="w-full rounded-lg border border-white/10 bg-brand-surface px-3 py-2 text-sm"
            value={form.staffMemberId}
            onChange={(e) =>
              setForm((f) => ({ ...f, staffMemberId: e.target.value }))
            }
            required
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Fecha y hora</Label>
          <Input
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Input
            value={form.clientName}
            onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input
            value={form.clientPhone}
            onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Email (opcional)</Label>
          <Input
            type="email"
            value={form.clientEmail}
            onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Estado</Label>
          <select
            className="w-full rounded-lg border border-white/10 bg-brand-surface px-3 py-2 text-sm"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as "pending" | "confirmed",
              }))
            }
          >
            <option value="confirmed">Confirmada</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear cita"}
      </Button>
    </form>
  );
}
