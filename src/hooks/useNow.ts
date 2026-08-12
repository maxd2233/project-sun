import { useEffect, useState } from 'react';
import type { DateKey, TimeOfDay } from '../types';
import { toDateKey } from '../lib/date';
import { getCurrentDayNumber } from '../services/days';

/**
 * Live clock for a single component. Because each consumer owns its own
 * interval + state, ticking re-renders only that component — the parent
 * tree stays untouched. Pick the coarsest interval the consumer needs.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}

/**
 * The current local date as a `YYYY-MM-DD` key, re-derived on an interval.
 * `setState` bails out when the value hasn't changed, so the component only
 * re-renders when the calendar day actually rolls over (midnight, month,
 * year or a device timezone change). Defaults to a 30s poll.
 */
export function useTodayKey(intervalMs = 30_000): DateKey {
  const [todayKey, setTodayKey] = useState<DateKey>(() => toDateKey());

  useEffect(() => {
    const id = window.setInterval(() => setTodayKey(toDateKey()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return todayKey;
}

/**
 * The treatment day number, re-derived on an interval. The value only
 * changes when a mission-time boundary is crossed (e.g. exactly at 14:00),
 * so React bails out on the ticks in between — consumers re-render at most
 * once per day boundary instead of on every clock tick.
 */
export function useCurrentDayNumber(
  startDate: DateKey | undefined,
  scheduledTime: TimeOfDay,
  intervalMs = 60_000,
): number {
  const [dayNumber, setDayNumber] = useState<number>(() =>
    getCurrentDayNumber(startDate, scheduledTime),
  );

  useEffect(() => {
    const update = () => setDayNumber(getCurrentDayNumber(startDate, scheduledTime));
    const id = window.setInterval(update, intervalMs);
    return () => window.clearInterval(id);
  }, [startDate, scheduledTime, intervalMs]);

  return dayNumber;
}
