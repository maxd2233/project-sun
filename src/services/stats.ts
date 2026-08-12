import type { DailyRecord, DateKey } from '../types';
import { fromDateKey, monthStartKey, toDateKey } from '../lib/date';

/**
 * Derived statistics. Everything here is computed on demand from the real
 * records (the single source of truth) — nothing is stored or persisted.
 */

/** Sorted DateKeys of every completed day. */
export function completedKeys(records: Record<DateKey, DailyRecord>): DateKey[] {
  return Object.keys(records)
    .filter((key) => records[key]?.completed)
    .sort();
}

/** Number of completed missions across the whole history. */
export function completedCount(records: Record<DateKey, DailyRecord>): number {
  return completedKeys(records).length;
}

/** The earliest completed day, or null when there are no records. */
export function firstCompletedKey(
  records: Record<DateKey, DailyRecord>,
): DateKey | null {
  return completedKeys(records)[0] ?? null;
}

/**
 * Days between the first completed day and today (inclusive).
 * This is the denominator for the completion rate: how many days the
 * player *could* have completed since they started.
 */
export function elapsedDays(
  records: Record<DateKey, DailyRecord>,
  todayKey: DateKey = toDateKey(),
): number {
  const first = firstCompletedKey(records);
  if (first === null) return 0;
  const start = fromDateKey(first);
  const end = fromDateKey(todayKey);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

/** Percentage (0..100) of days completed since the first record. */
export function completionRate(
  records: Record<DateKey, DailyRecord>,
  todayKey: DateKey = toDateKey(),
): number {
  const done = completedCount(records);
  const possible = elapsedDays(records, todayKey);
  if (possible === 0) return 0;
  return Math.min(100, (done / possible) * 100);
}

/** Number of completed missions whose date falls in the given month. */
export function completedInMonth(
  records: Record<DateKey, DailyRecord>,
  monthKey: DateKey,
): number {
  const prefix = monthKey.slice(0, 7);
  return Object.keys(records).filter(
    (key) => key.startsWith(prefix) && records[key]?.completed,
  ).length;
}

/** One entry of the monthly history bar chart. */
export interface MonthSummary {
  /** First day of the month, `YYYY-MM-DD`. */
  monthKey: DateKey;
  /** Short Spanish month label, e.g. "Ago". */
  label: string;
  /** Completed missions in that month. */
  completed: number;
  /** Days available in that month. */
  daysInMonth: number;
}

/** Shift a month key by `offset` months (positive = forward). */
function shiftMonthKey(key: DateKey, offset: number): DateKey {
  const [year, month] = key.split('-').map(Number);
  return toDateKey(new Date(year, month - 1 + offset, 1));
}

/** Short Spanish month label with capitalized first letter, e.g. "Ago". */
function monthShortLabel(key: DateKey): string {
  const raw = new Intl.DateTimeFormat('es', { month: 'short' }).format(
    fromDateKey(key),
  );
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Summaries for the last `count` months including the current one,
 * oldest first. Used by the simple monthly visualization.
 */
export function lastMonthSummaries(
  records: Record<DateKey, DailyRecord>,
  count: number,
  todayKey: DateKey = toDateKey(),
): MonthSummary[] {
  const current = monthStartKey(todayKey);
  const summaries: MonthSummary[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const monthKey = shiftMonthKey(current, -offset);
    const next = shiftMonthKey(monthKey, 1);
    const daysInMonth = Math.round(
      (fromDateKey(next).getTime() - fromDateKey(monthKey).getTime()) / 86_400_000,
    );
    summaries.push({
      monthKey,
      label: monthShortLabel(monthKey),
      completed: completedInMonth(records, monthKey),
      daysInMonth,
    });
  }
  return summaries;
}

/**
 * Average time of day missions were completed, as `HH:MM`.
 * Uses a circular mean so late-night completions (e.g. 23:50) don't
 * skew the average towards noon. Returns null when there's no record
 * with a timestamp.
 */
export function averageCompletionTime(
  records: Record<DateKey, DailyRecord>,
): string | null {
  const minutes: number[] = [];
  for (const record of Object.values(records)) {
    if (!record.completed || !record.completedAt) continue;
    const date = new Date(record.completedAt);
    if (Number.isNaN(date.getTime())) continue;
    minutes.push(date.getHours() * 60 + date.getMinutes());
  }
  if (minutes.length === 0) return null;

  const radiansPerMinute = (2 * Math.PI) / 1440;
  let sinSum = 0;
  let cosSum = 0;
  for (const minute of minutes) {
    sinSum += Math.sin(minute * radiansPerMinute);
    cosSum += Math.cos(minute * radiansPerMinute);
  }
  const meanAngle = Math.atan2(sinSum / minutes.length, cosSum / minutes.length);
  let avgMinutes = meanAngle / radiansPerMinute;
  if (avgMinutes < 0) avgMinutes += 1440;

  const total = Math.round(avgMinutes) % 1440;
  const hours = String(Math.floor(total / 60)).padStart(2, '0');
  const mins = String(total % 60).padStart(2, '0');
  return `${hours}:${mins}`;
}
