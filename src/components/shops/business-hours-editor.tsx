"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BUSINESS_DAY_LABELS,
  type BusinessHourInput,
} from "@/lib/shops/business-hours";
import { cn } from "@/lib/utils";

type Props = {
  value: BusinessHourInput[];
  onChange: (hours: BusinessHourInput[]) => void;
  className?: string;
  showHeading?: boolean;
};

export function BusinessHoursEditor({
  value,
  onChange,
  className,
  showHeading = true,
}: Props) {
  function updateDay(dayOfWeek: number, patch: Partial<BusinessHourInput>) {
    onChange(
      value.map((row) =>
        row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row,
      ),
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      {showHeading ? (
        <div>
          <h2 className="text-lg font-semibold text-brand-gold">Horario de atención</h2>
          <p className="mt-1 text-sm text-brand-text-muted">
            Define cuándo la barbería acepta reservas. Los clientes lo verán en tu página
            pública.
          </p>
        </div>
      ) : null}

      <ul className="space-y-3 rounded-xl border border-white/10 bg-brand-surface divide-y divide-white/10">
        {value.map((row) => (
          <li
            key={row.dayOfWeek}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-[7rem] items-center justify-between gap-3 sm:justify-start">
              <span className="font-medium">{BUSINESS_DAY_LABELS[row.dayOfWeek]}</span>
              <label className="flex items-center gap-2 text-sm text-brand-text-muted">
                <input
                  type="checkbox"
                  checked={row.isClosed}
                  onChange={(e) =>
                    updateDay(row.dayOfWeek, { isClosed: e.target.checked })
                  }
                  className="rounded border-white/20"
                />
                Cerrado
              </label>
            </div>

            <div
              className={cn(
                "grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4",
                row.isClosed && "pointer-events-none opacity-40",
              )}
            >
              <div className="space-y-1">
                <Label className="text-xs text-brand-text-muted">Abre</Label>
                <Input
                  type="time"
                  value={row.openTime}
                  onChange={(e) =>
                    updateDay(row.dayOfWeek, { openTime: e.target.value })
                  }
                  disabled={row.isClosed}
                  required={!row.isClosed}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-brand-text-muted">Cierra</Label>
                <Input
                  type="time"
                  value={row.closeTime}
                  onChange={(e) =>
                    updateDay(row.dayOfWeek, { closeTime: e.target.value })
                  }
                  disabled={row.isClosed}
                  required={!row.isClosed}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
