import {
  addMinutes,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export type Slot = {
  startAt: string;
  endAt: string;
  availableStaffIds: string[];
};

export type StaffSchedule = {
  staffMemberId: string;
  sortOrder: number;
  businessHours: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[];
  exceptions: { date: string; isClosed: boolean; customOpen?: string | null; customClose?: string | null }[];
  appointments: { startAt: Date; endAt: Date }[];
  blocked: { startAt: Date; endAt: Date }[];
};

export type AvailabilityInput = {
  timezone: string;
  serviceDurationMinutes: number;
  minNoticeHours: number;
  maxDaysAhead: number;
  dateFrom: string;
  dateTo: string;
  shopExceptions: { date: string; isClosed: boolean }[];
  staffSchedules: StaffSchedule[];
  preference: "specific" | "any";
  staffMemberId?: string;
};

function parseTimeOnDate(dateStr: string, time: string, tz: string): Date {
  const local = parseISO(`${dateStr}T${time}:00`);
  return fromZonedTime(local, tz);
}

function getDayHours(
  schedule: StaffSchedule,
  dateStr: string,
  dayOfWeek: number,
  shopClosed: boolean,
) {
  if (shopClosed) return null;
  const exc = schedule.exceptions.find((e) => e.date === dateStr);
  if (exc?.isClosed) return null;
  if (exc?.customOpen && exc?.customClose) {
    return { open: exc.customOpen, close: exc.customClose };
  }
  const bh = schedule.businessHours.find((h) => h.dayOfWeek === dayOfWeek);
  if (!bh || bh.isClosed) return null;
  return { open: bh.openTime, close: bh.closeTime };
}

function isSlotBlocked(
  start: Date,
  end: Date,
  appointments: { startAt: Date; endAt: Date }[],
  blocked: { startAt: Date; endAt: Date }[],
) {
  for (const a of appointments) {
    if (start < a.endAt && end > a.startAt) return true;
  }
  for (const b of blocked) {
    if (start < b.endAt && end > b.startAt) return true;
  }
  return false;
}

function generateSlotsForStaff(
  schedule: StaffSchedule,
  dateStr: string,
  dayOfWeek: number,
  shopClosed: boolean,
  duration: number,
  tz: string,
  now: Date,
  minNotice: Date,
): { start: Date; end: Date }[] {
  const hours = getDayHours(schedule, dateStr, dayOfWeek, shopClosed);
  if (!hours) return [];

  const dayStart = parseTimeOnDate(dateStr, hours.open, tz);
  const dayEnd = parseTimeOnDate(dateStr, hours.close, tz);
  const slots: { start: Date; end: Date }[] = [];

  let cursor = dayStart;
  while (addMinutes(cursor, duration) <= dayEnd) {
    const end = addMinutes(cursor, duration);
    if (
      isAfter(cursor, minNotice) &&
      !isSlotBlocked(cursor, end, schedule.appointments, schedule.blocked)
    ) {
      slots.push({ start: cursor, end });
    }
    cursor = addMinutes(cursor, duration);
  }
  return slots;
}

export function getAvailableSlots(input: AvailabilityInput): Slot[] {
  const {
    timezone: tz,
    serviceDurationMinutes: duration,
    minNoticeHours,
    maxDaysAhead,
    dateFrom,
    dateTo,
    shopExceptions,
    staffSchedules,
    preference,
    staffMemberId,
  } = input;

  const now = new Date();
  const minNotice = addMinutes(now, minNoticeHours * 60);
  const maxDate = addMinutes(startOfDay(now), maxDaysAhead * 24 * 60);

  const schedules =
    preference === "specific" && staffMemberId
      ? staffSchedules.filter((s) => s.staffMemberId === staffMemberId)
      : staffSchedules;

  const slotMap = new Map<string, Slot>();

  let cursorDate = parseISO(dateFrom);
  const endDate = parseISO(dateTo);

  while (cursorDate <= endDate) {
    const dateStr = format(cursorDate, "yyyy-MM-dd");
    const dayOfWeek = toZonedTime(cursorDate, tz).getDay();
    const shopExc = shopExceptions.find((e) => e.date === dateStr);
    const shopClosed = shopExc?.isClosed ?? false;

    for (const schedule of schedules) {
      const rawSlots = generateSlotsForStaff(
        schedule,
        dateStr,
        dayOfWeek,
        shopClosed,
        duration,
        tz,
        now,
        minNotice,
      );

      for (const { start, end } of rawSlots) {
        if (isAfter(start, maxDate)) continue;
        const key = start.toISOString();
        const existing = slotMap.get(key);
        if (existing) {
          if (!existing.availableStaffIds.includes(schedule.staffMemberId)) {
            existing.availableStaffIds.push(schedule.staffMemberId);
          }
        } else {
          slotMap.set(key, {
            startAt: key,
            endAt: end.toISOString(),
            availableStaffIds: [schedule.staffMemberId],
          });
        }
      }
    }

    cursorDate = addMinutes(cursorDate, 24 * 60);
  }

  return Array.from(slotMap.values()).sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
}

export function pickStaffForAny(
  slot: Slot,
  staffSchedules: StaffSchedule[],
): string | null {
  const sorted = [...slot.availableStaffIds].sort((a, b) => {
    const sa = staffSchedules.find((s) => s.staffMemberId === a)?.sortOrder ?? 0;
    const sb = staffSchedules.find((s) => s.staffMemberId === b)?.sortOrder ?? 0;
    return sa - sb;
  });
  return sorted[0] ?? null;
}
