import type { DateKey, DailyRecord } from '../types';
import { shiftDateKey, toDateKey } from '../lib/date';
import { isCompleted } from './records';

/**
 * Count consecutive completed days ending at `endKey`.
 * Today counts if completed; otherwise a streak that "ends yesterday"
 * is still alive until today's deadline passes. Passing `acceptTodayGap`
 * lets callers decide whether a gap of 0 (today not yet done) keeps the
 * streak alive. For "current streak" we allow that gap.
 */
export function countStreakEndingAt(
  records: Record<DateKey, DailyRecord>,
  endKey: DateKey,
  allowGap = false,
): number {
  let streak = 0;
  let cursor = endKey;

  if (!isCompleted(records[cursor])) {
    if (!allowGap) return 0;
    // Only one uncompleted day is tolerated when it's the "today" gap.
    const previous = shiftDateKey(cursor, -1);
    if (!isCompleted(records[previous])) return 0;
    cursor = previous;
  }

  while (isCompleted(records[cursor])) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streak;
}

/** Longest run of consecutive completed days across all records. */
export function bestStreak(records: Record<DateKey, DailyRecord>): number {
  const sorted = Object.keys(records)
    .filter((key) => isCompleted(records[key]))
    .sort();

  let best = 0;
  let run = 0;
  let previous: DateKey | null = null;

  for (const key of sorted) {
    if (previous === null || daysApart(previous, key) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    previous = key;
  }

  return best;
}

/** Absolute day distance between two DateKeys. */
function daysApart(a: DateKey, b: DateKey): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const aMs = new Date(ay, am - 1, ad).getTime();
  const bMs = new Date(by, bm - 1, bd).getTime();
  return Math.abs(Math.round((bMs - aMs) / 86_400_000));
}

/** The current streak, ending today with a tolerated gap for today. */
export function currentStreak(
  records: Record<DateKey, DailyRecord>,
  todayKey: DateKey = toDateKey(),
): number {
  return countStreakEndingAt(records, todayKey, true);
}

/** Number of completed days in the whole history. */
export function totalCompleted(records: Record<DateKey, DailyRecord>): number {
  return Object.values(records).filter((r) => r.completed).length;
}

/** Sum of XP awarded across all completed days. */
export function totalXp(records: Record<DateKey, DailyRecord>): number {
  return Object.values(records).reduce((sum, r) => sum + (r.completed ? r.xpEarned : 0), 0);
}
