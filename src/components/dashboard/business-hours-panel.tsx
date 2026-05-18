"use client";

import { useState } from "react";
import { BusinessHoursEditor } from "@/components/shops/business-hours-editor";
import { Button } from "@/components/ui/button";
import { saveShopBusinessHours } from "@/lib/actions/business-hours";
import type { BusinessHourInput } from "@/lib/shops/business-hours";

export function BusinessHoursPanel({ initial }: { initial: BusinessHourInput[] }) {
  const [hours, setHours] = useState(initial);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(
    null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setFeedback(null);
    const result = await saveShopBusinessHours(hours);
    setPending(false);
    if (!result.ok) {
      setFeedback({ type: "error", text: result.error });
      return;
    }
    setFeedback({ type: "ok", text: "Horario guardado correctamente" });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <BusinessHoursEditor value={hours} onChange={setHours} showHeading={false} />
      <p className="text-xs text-brand-text-muted">
        Al guardar, el horario de todo el equipo se actualiza para coincidir con el de la
        barbería.
      </p>
      {feedback ? (
        <p
          className={
            feedback.type === "ok" ? "text-sm text-green-400" : "text-sm text-red-400"
          }
        >
          {feedback.text}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar horario"}
      </Button>
    </form>
  );
}
