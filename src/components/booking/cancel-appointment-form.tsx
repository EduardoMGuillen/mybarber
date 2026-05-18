"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelPublicAppointment } from "@/lib/actions/appointments";

export function CancelAppointmentForm({
  slug,
  token,
  shopName,
  when,
  serviceName,
}: {
  slug: string;
  token: string;
  shopName: string;
  when: string;
  serviceName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      await cancelPublicAppointment(token);
      router.push(`/${slug}/reservar/cancelar?done=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 text-left">
      <div className="rounded-xl border border-white/10 bg-brand-surface p-5 text-sm">
        <p className="font-semibold">{shopName}</p>
        <p className="mt-2 text-brand-text-muted">{serviceName}</p>
        <p className="mt-1 capitalize text-brand-text">{when}</p>
      </div>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="destructive"
          className="flex-1"
          disabled={loading}
          onClick={handleCancel}
        >
          {loading ? "Cancelando…" : "Sí, cancelar cita"}
        </Button>
        <Button asChild type="button" variant="outline" className="flex-1">
          <Link href={`/${slug}`}>No, volver</Link>
        </Button>
      </div>
    </div>
  );
}

