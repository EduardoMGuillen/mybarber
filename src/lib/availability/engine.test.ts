import { describe, expect, it } from "vitest";
import { getAvailableSlots, pickStaffForAny } from "./engine";

describe("availability engine", () => {
  const staffA = {
    staffMemberId: "a",
    sortOrder: 0,
    businessHours: [
      { dayOfWeek: 1, openTime: "09:00", closeTime: "12:00", isClosed: false },
    ],
    exceptions: [],
    appointments: [],
    blocked: [],
  };

  const staffB = {
    staffMemberId: "b",
    sortOrder: 1,
    businessHours: [
      { dayOfWeek: 1, openTime: "14:00", closeTime: "17:00", isClosed: false },
    ],
    exceptions: [],
    appointments: [],
    blocked: [],
  };

  it("returns union slots for any preference", () => {
    const monday = "2026-05-18";
    const slots = getAvailableSlots({
      timezone: "America/Tegucigalpa",
      serviceDurationMinutes: 30,
      minNoticeHours: 0,
      maxDaysAhead: 30,
      dateFrom: monday,
      dateTo: monday,
      shopExceptions: [],
      staffSchedules: [staffA, staffB],
      preference: "any",
    });
    expect(slots.length).toBeGreaterThan(0);
    const withBoth = slots.find((s) => s.availableStaffIds.length === 2);
    expect(withBoth).toBeUndefined();
    expect(slots.some((s) => s.availableStaffIds.includes("a"))).toBe(true);
    expect(slots.some((s) => s.availableStaffIds.includes("b"))).toBe(true);
  });

  it("picks lowest sortOrder staff", () => {
    const slot = {
      startAt: "2026-05-18T15:00:00.000Z",
      endAt: "2026-05-18T15:30:00.000Z",
      availableStaffIds: ["b", "a"],
    };
    expect(pickStaffForAny(slot, [staffA, staffB])).toBe("a");
  });
});
