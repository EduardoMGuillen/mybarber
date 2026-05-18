import { DEFAULT_BUSINESS_HOURS } from "@/lib/shops/defaults";

export type BusinessHourInput = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export const BUSINESS_DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function createDefaultBusinessHours(): BusinessHourInput[] {
  return DEFAULT_BUSINESS_HOURS.map((h) => ({ ...h }));
}

export function parseBusinessHoursInput(
  input: unknown,
): { ok: true; data: BusinessHourInput[] } | { ok: false; error: string } {
  if (!Array.isArray(input) || input.length !== 7) {
    return { ok: false, error: "Debes configurar los 7 días de la semana" };
  }

  const seen = new Set<number>();
  const data: BusinessHourInput[] = [];

  for (const row of input) {
    if (!row || typeof row !== "object") {
      return { ok: false, error: "Horario inválido" };
    }
    const r = row as Record<string, unknown>;
    const dayOfWeek = Number(r.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return { ok: false, error: "Día de la semana inválido" };
    }
    if (seen.has(dayOfWeek)) {
      return { ok: false, error: "Día duplicado en el horario" };
    }
    seen.add(dayOfWeek);

    const isClosed = Boolean(r.isClosed);
    const openTime = String(r.openTime ?? "");
    const closeTime = String(r.closeTime ?? "");

    if (!isClosed) {
      if (!TIME_RE.test(openTime) || !TIME_RE.test(closeTime)) {
        return {
          ok: false,
          error: `Horario inválido el ${BUSINESS_DAY_LABELS[dayOfWeek]}. Usa formato HH:MM`,
        };
      }
      const [oh, om] = openTime.split(":").map(Number);
      const [ch, cm] = closeTime.split(":").map(Number);
      const openMins = oh * 60 + om;
      const closeMins = ch * 60 + cm;
      if (closeMins <= openMins) {
        return {
          ok: false,
          error: `En ${BUSINESS_DAY_LABELS[dayOfWeek]} la hora de cierre debe ser después de la apertura`,
        };
      }
    }

    data.push({
      dayOfWeek,
      openTime: isClosed ? "09:00" : openTime,
      closeTime: isClosed ? "17:00" : closeTime,
      isClosed,
    });
  }

  for (let d = 0; d < 7; d++) {
    if (!seen.has(d)) {
      return { ok: false, error: "Falta configurar algún día de la semana" };
    }
  }

  data.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  return { ok: true, data };
}

export function rowsToInputs(
  rows: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[],
): BusinessHourInput[] {
  if (rows.length === 0) return createDefaultBusinessHours();
  const byDay = new Map(rows.map((r) => [r.dayOfWeek, r]));
  return Array.from({ length: 7 }, (_, day) => {
    const row = byDay.get(day);
    if (row) {
      return {
        dayOfWeek: row.dayOfWeek,
        openTime: row.openTime,
        closeTime: row.closeTime,
        isClosed: row.isClosed,
      };
    }
    return {
      dayOfWeek: day,
      openTime: "09:00",
      closeTime: "19:00",
      isClosed: day === 0,
    };
  });
}
