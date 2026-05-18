import { TRIAL_DAYS } from "@/lib/constants";

export const DEFAULT_BUSINESS_HOURS = [
  { dayOfWeek: 0, openTime: "09:00", closeTime: "17:00", isClosed: true },
  { dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 2, openTime: "09:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 3, openTime: "09:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 4, openTime: "09:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 5, openTime: "09:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 6, openTime: "09:00", closeTime: "17:00", isClosed: false },
];

export function getTrialEndsAt() {
  const d = new Date();
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d;
}
