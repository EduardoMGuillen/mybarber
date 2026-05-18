"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateUserPreferences } from "@/lib/actions/preferences";

type Prefs = {
  locale: "es" | "en";
  theme: "dark" | "light" | "system";
  emailNewBooking: boolean;
  emailBookingConfirmed: boolean;
  emailTrialReminders: boolean;
  emailAppointmentReminder: boolean;
};

export function PreferencesForm({ initial }: { initial: Prefs }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof Omit<Prefs, "locale" | "theme">) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateUserPreferences(prefs);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <div className="space-y-2">
        <Label htmlFor="locale">Idioma</Label>
        <select
          id="locale"
          className="w-full rounded-lg border border-white/10 bg-brand-surface px-3 py-2 text-sm"
          value={prefs.locale}
          onChange={(e) => {
            setPrefs((p) => ({
              ...p,
              locale: e.target.value as "es" | "en",
            }));
            setSaved(false);
          }}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
        <p className="text-xs text-brand-text-muted">
          Se guarda en tu cuenta y en una cookie para futuras visitas.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Tema</Label>
        <select
          id="theme"
          className="w-full rounded-lg border border-white/10 bg-brand-surface px-3 py-2 text-sm"
          value={prefs.theme}
          onChange={(e) => {
            setPrefs((p) => ({
              ...p,
              theme: e.target.value as Prefs["theme"],
            }));
            setSaved(false);
          }}
        >
          <option value="dark">Oscuro</option>
          <option value="light">Claro</option>
          <option value="system">Sistema</option>
        </select>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-white/10 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-gold">
          Correos
        </legend>
        {(
          [
            ["emailNewBooking", "Nueva reserva pendiente"],
            ["emailBookingConfirmed", "Reserva confirmada"],
            ["emailTrialReminders", "Recordatorios de prueba"],
            ["emailAppointmentReminder", "Recordatorio de cita al cliente"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={() => toggle(key)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar preferencias"}
      </Button>
      {saved && (
        <p className="text-sm text-green-400">Preferencias guardadas.</p>
      )}
    </form>
  );
}
