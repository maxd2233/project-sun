import type { DateKey, TimeOfDay } from '../types';

export const DATE_KEY_FORMAT = 'YYYY-MM-DD' as const;

/**
 * Format a Date as a local `YYYY-MM-DD` key without pulling in a date lib.
 * Builds the string from local date parts so the key stays in local time.
 */
export function toDateKey(date: Date = new Date()): DateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse a `YYYY-MM-DD` key back into a local Date at 00:00:00. */
export function fromDateKey(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Number of days between two DateKeys (b - a), ignoring time. */
export function daysBetween(a: DateKey, b: DateKey): number {
  const msPerDay = 86_400_000;
  const aDate = fromDateKey(a);
  const bDate = fromDateKey(b);
  aDate.setHours(0, 0, 0, 0);
  bDate.setHours(0, 0, 0, 0);
  return Math.round((bDate.getTime() - aDate.getTime()) / msPerDay);
}

/** The DateKey for the day `offset` days relative to `today` (or any base). */
export function shiftDateKey(key: DateKey, offset: number): DateKey {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + offset);
  return toDateKey(d);
}

/** `YYYY-MM-DD` for the first day of the month containing `key`. */
export function monthStartKey(key: DateKey): DateKey {
  const d = fromDateKey(key);
  d.setDate(1);
  return toDateKey(d);
}

/** `YYYY-MM-DD` for the last day of the month containing `key`. */
export function monthEndKey(key: DateKey): DateKey {
  const d = fromDateKey(key);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return toDateKey(d);
}

/** Number of days in the month containing `key`. */
export function daysInMonth(key: DateKey): number {
  return daysBetween(monthStartKey(key), monthEndKey(key)) + 1;
}

/** Day-of-week of the first day of the month containing `key` (0 = Sunday). */
export function firstWeekdayOfMonth(key: DateKey): number {
  return fromDateKey(monthStartKey(key)).getDay();
}

/** Human readable month + year, e.g. "agosto de 2026". */
export function monthLabel(key: DateKey): string {
  return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(
    fromDateKey(key),
  );
}

/** Parse a `HH:mm` TimeOfDay into a Date set to today at that time. */
export function timeOfDayToDate(time: TimeOfDay, base: Date = new Date()): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date(base);
  d.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return d;
}

/** True when `now` is before the given scheduled time of today. */
export function isBeforeTime(time: TimeOfDay, now: Date = new Date()): boolean {
  return now.getTime() < timeOfDayToDate(time, now).getTime();
}

/** Remaining time until `time` today, clamped to >= 0ms. */
export function msUntil(time: TimeOfDay, now: Date = new Date()): number {
  const target = timeOfDayToDate(time, now);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, diff);
}

/** Format a milliseconds duration as `HH:MM:SS`. */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Local time as `HH:MM`, e.g. "14:03". */
export function formatTime(now: Date): string {
  return new Intl.DateTimeFormat('es', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
}

/** Spanish long date, e.g. "miércoles, 12 de agosto". */
export function formatDateLong(now: Date): string {
  const formatted = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Spanish long date with year, e.g. "miércoles, 12 de agosto de 2026". */
export function formatDateLongYear(key: DateKey): string {
  const formatted = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fromDateKey(key));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Warm greeting based on the time of day. */
export function greeting(now: Date): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Percentage of the current day that has already elapsed (0..100). */
export function dayProgressPercent(now: Date): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return (elapsed / total) * 100;
}

/** Rough part of the day, used to adapt the hero sun. */
export type DaySegment = 'dawn' | 'day' | 'dusk' | 'night';

export function getDaySegment(now: Date): DaySegment {
  const h = now.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}
