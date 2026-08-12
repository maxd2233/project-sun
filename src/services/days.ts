import type { DateKey, TimeOfDay } from '../types';
import { daysBetween, fromDateKey, toDateKey } from '../lib/date';

/**
 * The treatment's day counter — the ONE source of truth for the day number.
 *
 * The day boundary follows the scheduled mission time, never midnight. "Day
 * n" runs from `startDate + (n-1) days @ scheduledTime` to
 * `startDate + n days @ scheduledTime`; Day 1 begins on the moment the
 * treatment started (start of the startDate's calendar day), so every hour
 * of the start day is Day 1.
 *
 * Examples with start = 2026-08-11 and scheduledTime = "14:00":
 *   11 ago 13:00 -> 1 · 11 ago 15:00 -> 1
 *   12 ago 13:59 -> 1 · 12 ago 14:00 -> 2
 *   13 ago 13:59 -> 2 · 13 ago 14:00 -> 3
 *
 * The day number depends ONLY on the persisted `startDate`, the mission's
 * scheduled time and the clock. Completions, XP, streak and records NEVER
 * move it — the mission only records whether a day was fulfilled.
 */

/** The exact instant the treatment began: `startDate` at the mission time. */
export function treatmentStartInstant(
  startDate: DateKey,
  scheduledTime: TimeOfDay,
): Date {
  const fallback = /^([01]?\d|2[0-3]):[0-5]\d$/.test(scheduledTime)
    ? scheduledTime
    : '00:00';
  const [hours, minutes] = fallback.split(':').map(Number);
  const d = fromDateKey(startDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * The current day number of the treatment (≥ 1). Automatically clamps the
 * time before the first mission boundary to Day 1, and tolerates a missing
 * `startDate` (defaults to today, i.e. the day the app was first used).
 */
export function getCurrentDayNumber(
  startDate: DateKey | undefined,
  scheduledTime: TimeOfDay,
  now: Date = new Date(),
): number {
  const start = startDate ?? toDateKey(now);
  const calendarDay = daysBetween(start, toDateKey(now)) + 1;
  const todayBoundary = treatmentStartInstant(toDateKey(now), scheduledTime).getTime();
  if (now.getTime() < todayBoundary) return Math.max(1, calendarDay - 1);
  return Math.max(1, calendarDay);
}

/**
 * The day number a calendar date represents, evaluated with the SAME rule
 * as `getCurrentDayNumber` at that date's scheduled boundary. Returns null
 * for dates before the treatment started.
 *
 * Example: start 2026-08-11 at 14:00 → 11 ago = 1, 12 ago = 2, 13 ago = 3.
 */
export function getDayNumberForDate(
  startDate: DateKey | undefined,
  scheduledTime: TimeOfDay,
  key: DateKey,
): number | null {
  if (startDate !== undefined && key < startDate) return null;
  return getCurrentDayNumber(
    startDate,
    scheduledTime,
    treatmentStartInstant(key, scheduledTime),
  );
}