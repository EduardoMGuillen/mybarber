import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  appointments,
  availabilityExceptions,
  blockedSlots,
  businessHours,
  services,
  shopStaff,
  staffAvailabilityExceptions,
  staffBusinessHours,
} from "@/lib/db/schema";
import type { ShopRow } from "@/lib/tenant";
import { getAvailableSlots, type StaffSchedule } from "./engine";

export async function loadAvailabilityContext(shopId: string) {
  const db = requireDb();

  const [staff, svc, shopHours, shopExc] = await Promise.all([
    db.select().from(shopStaff).where(and(eq(shopStaff.shopId, shopId), eq(shopStaff.active, true), eq(shopStaff.acceptsOnlineBookings, true))),
    db.select().from(services).where(and(eq(services.shopId, shopId), eq(services.active, true))),
    db.select().from(businessHours).where(eq(businessHours.shopId, shopId)),
    db.select().from(availabilityExceptions).where(eq(availabilityExceptions.shopId, shopId)),
  ]);

  const staffSchedules: StaffSchedule[] = [];

  for (const member of staff) {
    const [hours, exc, appts, blocks] = await Promise.all([
      db.select().from(staffBusinessHours).where(eq(staffBusinessHours.staffMemberId, member.id)),
      db.select().from(staffAvailabilityExceptions).where(eq(staffAvailabilityExceptions.staffMemberId, member.id)),
      db
        .select({ startAt: appointments.startAt, endAt: appointments.endAt })
        .from(appointments)
        .where(
          and(
            eq(appointments.staffMemberId, member.id),
            inArray(appointments.status, ["pending", "confirmed"]),
          ),
        ),
      db
        .select({ startAt: blockedSlots.startAt, endAt: blockedSlots.endAt })
        .from(blockedSlots)
        .where(
          and(
            eq(blockedSlots.shopId, shopId),
            or(eq(blockedSlots.staffMemberId, member.id), isNull(blockedSlots.staffMemberId)),
          ),
        ),
    ]);

    const useHours =
      hours.length > 0
        ? hours
        : shopHours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          }));

    staffSchedules.push({
      staffMemberId: member.id,
      sortOrder: member.sortOrder,
      businessHours: useHours,
      exceptions: exc,
      appointments: appts.map((a) => ({
        startAt: new Date(a.startAt),
        endAt: new Date(a.endAt),
      })),
      blocked: blocks.map((b) => ({
        startAt: new Date(b.startAt),
        endAt: new Date(b.endAt),
      })),
    });
  }

  return { staff, services: svc, shopHours, shopExceptions: shopExc, staffSchedules };
}

export async function getSlotsForBooking(
  shop: ShopRow,
  params: {
    serviceId: string;
    dateFrom: string;
    dateTo: string;
    staffMemberId?: string;
    preference: "specific" | "any";
  },
) {
  const ctx = await loadAvailabilityContext(shop.id);
  const service = ctx.services.find((s) => s.id === params.serviceId);
  if (!service) return [];

  return getAvailableSlots({
    timezone: shop.timezone,
    serviceDurationMinutes: service.durationMinutes,
    minNoticeHours: shop.minNoticeHours,
    maxDaysAhead: shop.maxDaysAhead,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    shopExceptions: ctx.shopExceptions.map((e) => ({
      date: e.date,
      isClosed: e.isClosed,
    })),
    staffSchedules: ctx.staffSchedules,
    preference: params.preference,
    staffMemberId: params.staffMemberId,
  });
}
