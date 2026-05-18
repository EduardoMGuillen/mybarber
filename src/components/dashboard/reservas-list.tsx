"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  approveAppointment,
  rejectAppointment,
  reassignAppointmentStaff,
  updateAppointmentStatus,
} from "@/lib/actions/appointments";

export type ReservaRow = {
  id: string;
  status: string;
  clientName: string;
  clientPhone: string;
  startAt: string;
  serviceName: string;
  staffName: string;
  staffMemberId: string;
};

type StaffOption = { id: string; displayName: string };

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
};

export function ReservasList({
  appointments,
  staff,
  canReassign,
}: {
  appointments: ReservaRow[];
  staff: StaffOption[];
  canReassign: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  if (appointments.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-brand-surface p-8 text-center text-brand-text-muted">
        No hay reservas pendientes ni confirmadas.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <ul className="space-y-3">
        {appointments.map((appt) => (
          <li
            key={appt.id}
            className="rounded-xl border border-white/10 bg-brand-surface p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{appt.clientName}</p>
                <p className="text-sm text-brand-text-muted">{appt.clientPhone}</p>
                <p className="mt-2 text-sm">
                  {appt.serviceName} · {appt.staffName}
                </p>
                <p className="text-sm text-brand-gold">
                  {new Date(appt.startAt).toLocaleString("es-HN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${
                    appt.status === "pending"
                      ? "bg-amber-500/20 text-amber-300"
                      : appt.status === "confirmed"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-white/10 text-brand-text-muted"
                  }`}
                >
                  {STATUS_LABELS[appt.status] ?? appt.status}
                </span>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                {appt.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={pending}
                      onClick={() => run(() => approveAppointment(appt.id))}
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={pending}
                      onClick={() => run(() => rejectAppointment(appt.id))}
                    >
                      Rechazar
                    </Button>
                    {canReassign && staff.length > 1 && (
                      <select
                        className="w-full rounded-lg border border-white/10 bg-brand-black px-2 py-2.5 text-sm sm:w-auto sm:py-1.5"
                        defaultValue=""
                        disabled={pending}
                        onChange={(e) => {
                          const id = e.target.value;
                          if (!id) return;
                          run(() => reassignAppointmentStaff(appt.id, id));
                          e.target.value = "";
                        }}
                      >
                        <option value="">Reasignar…</option>
                        {staff
                          .filter((s) => s.id !== appt.staffMemberId)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.displayName}
                            </option>
                          ))}
                      </select>
                    )}
                  </>
                )}
                {appt.status === "confirmed" && (
                  <>
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        run(() => updateAppointmentStatus(appt.id, "completed"))
                      }
                    >
                      Completar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={pending}
                      onClick={() =>
                        run(() => updateAppointmentStatus(appt.id, "no_show"))
                      }
                    >
                      No asistió
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={pending}
                      onClick={() =>
                        run(() => updateAppointmentStatus(appt.id, "cancelled"))
                      }
                    >
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
