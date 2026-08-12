import type { AppState, DailyRecord, DateKey } from '../types';
import {
  createDefaultState,
  DEFAULT_PROGRESS,
  recomputeProgress,
} from '../services/persistence';
import { shiftDateKey, toDateKey } from './date';

/**
 * Test/demo seeding via `?seed=N` in the URL. It only acts when the app
 * has NO records yet, so it never overwrites real data — and once seeded,
 * the state is persisted normally and the flag is simply ignored.
 *
 * `?seed=1` completes yesterday, leaving the current streak at 1 so the
 * next press registers today as day 2. `?seed=N` preloads N consecutive
 * days ending yesterday.
 */

export function parseSeedParam(
  search: string = typeof window === 'undefined' ? '' : window.location.search,
): number | null {
  const raw = new URLSearchParams(search).get('seed');
  if (raw === null) return null;
  const days = Number(raw);
  return Number.isInteger(days) && days >= 1 && days <= 30 ? days : null;
}

export function buildSeededState(seedDays: number, base: Date = new Date()): AppState {
  const state = createDefaultState();
  const today = toDateKey(base);
  const records: Record<DateKey, DailyRecord> = {};

  for (let back = seedDays; back >= 1; back -= 1) {
    const key = shiftDateKey(today, -back);
    records[key] = {
      date: key,
      completed: true,
      completedAt: new Date(base).toISOString(),
      xpEarned: 120,
    };
  }

  // The seeded run started `seedDays` days ago, so today is Day `seedDays + 1`.
  const progress = recomputeProgress(
    records,
    { ...DEFAULT_PROGRESS, startDate: shiftDateKey(today, -seedDays) },
    {
      mission: state.mission,
      events: state.events,
    },
  );

  return { ...state, records, progress };
}