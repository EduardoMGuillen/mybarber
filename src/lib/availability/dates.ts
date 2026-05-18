import { parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

/** Interpreta YYYY-MM-DD como mediodía en la zona de la barbería (evita errores UTC). */
export function dateAtNoonInTimezone(dateStr: string, timezone: string): Date {
  return fromZonedTime(parseISO(`${dateStr}T12:00:00`), timezone);
}

/** 0 = domingo … 6 = sábado, según calendario local de la barbería. */
export function getDayOfWeekInTimezone(dateStr: string, timezone: string): number {
  return toZonedTime(dateAtNoonInTimezone(dateStr, timezone), timezone).getDay();
}

export function formatDateInTimezone(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd");
}
