import { useEffect, useState } from 'react';
import type { DateKey } from '../types';
import { toDateKey } from '../lib/date';

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
