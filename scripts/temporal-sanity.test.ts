import { strict as assert } from 'node:assert';
import {
  daysBetween,
  fromDateKey,
  monthStartKey,
  msUntil,
  shiftDateKey,
  timeOfDayToDate,
  toDateKey,
} from '../src/lib/date';
import {
  getMissionPhase,
  getMissionState,
  isNearMissionTime,
  MISSION_NEAR_MINUTES,
  missionHintText,
} from '../src/services/mission';
import {
  bestStreak,
  countStreakEndingAt,
  currentStreak,
} from '../src/services/streaks';
import {
  findDuplicate,
  hasRecord,
  isCompleted,
  isDuplicateEntry,
  isMissionCompletedOn,
} from '../src/services/records';
import { appReducer } from '../src/store/reducer';
import { createDefaultState } from '../src/services/persistence';
import { getCompanionVisitKind } from '../src/features/companion/state';
import type { AppAction } from '../src/store/actions';
import type { DailyRecord, Mission } from '../src/types';

const MISSION: Mission = {
  id: 'mission_daily',
  title: 'MISIÓN DIARIA',
  scheduledTime: '14:00',
  enabled: true,
};

/** A completed record for a DateKey (local ISO timestamp at 14:00). */
function rec(key: string): DailyRecord {
  const [y, m, d] = key.split('-').map(Number);
  return {
    date: key,
    completed: true,
    completedAt: new Date(y, m - 1, d, 14, 0, 0).toISOString(),
    xpEarned: 100,
  };
}

/** Build a records map from DateKeys. */
function recordsOf(...keys: string[]): Record<string, DailyRecord> {
  const out: Record<string, DailyRecord> = {};
  for (const key of keys) out[key] = rec(key);
  return out;
}

let failures = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL  ${name}`);
    console.error(error);
  }
}

// ---------------------------------------------------------------------------
// Current day + date helpers (device-local, calendar based)
// ---------------------------------------------------------------------------

check('toDateKey uses device-local calendar date parts', () => {
  assert.equal(toDateKey(new Date(2026, 7, 12)), '2026-08-12');
  assert.equal(toDateKey(new Date(2026, 7, 12, 23, 59, 59)), '2026-08-12');
  assert.equal(toDateKey(new Date(2026, 7, 13, 0, 0, 1)), '2026-08-13');
  assert.equal(toDateKey(new Date(2026, 0, 1)), '2026-01-01');
});

check('fromDateKey / toDateKey round-trip is lossless', () => {
  assert.equal(toDateKey(fromDateKey('2026-08-12')), '2026-08-12');
  const d = fromDateKey('2026-08-12');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 7);
  assert.equal(d.getDate(), 12);
});

check('daysBetween is calendar-accurate across month/year boundaries', () => {
  assert.equal(daysBetween('2026-08-12', '2026-08-13'), 1);
  assert.equal(daysBetween('2026-08-12', '2026-09-01'), 20);
  assert.equal(daysBetween('2025-12-31', '2026-01-01'), 1);
  assert.equal(daysBetween('2026-01-01', '2026-12-31'), 364);
});

check('daysBetween handles leap years', () => {
  assert.equal(daysBetween('2028-02-28', '2028-03-01'), 2); // Feb 29 exists
  assert.equal(daysBetween('2027-02-28', '2027-03-01'), 1); // no leap
});

check('daysBetween tolerates DST shifts (23h/25h days)', () => {
  // 2026-03-08 is the US spring-forward date; Math.round keeps this exact
  // in every timezone, with or without DST.
  assert.equal(daysBetween('2026-03-07', '2026-03-09'), 2);
  assert.equal(daysBetween('2026-03-07', '2026-03-08'), 1);
  // Fall-back weekend (2026-11-01).
  assert.equal(daysBetween('2026-10-31', '2026-11-02'), 2);
});

check('shiftDateKey steps calendar days, not 24h blocks (DST-safe)', () => {
  assert.equal(shiftDateKey('2026-03-07', 1), '2026-03-08'); // spring forward
  assert.equal(shiftDateKey('2026-10-31', 1), '2026-11-01'); // fall back
  assert.equal(shiftDateKey('2026-08-12', -2), '2026-08-10');
});

check('shiftDateKey crosses month and year boundaries correctly', () => {
  assert.equal(shiftDateKey('2026-08-31', 1), '2026-09-01');
  assert.equal(shiftDateKey('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDateKey('2027-01-01', -1), '2026-12-31');
});

check('shiftDateKey handles leap years', () => {
  assert.equal(shiftDateKey('2028-02-28', 1), '2028-02-29');
  assert.equal(shiftDateKey('2028-02-29', 1), '2028-03-01');
  assert.equal(shiftDateKey('2027-02-28', 1), '2027-03-01');
});

check('monthStartKey normalizes to the first of the month', () => {
  assert.equal(monthStartKey('2026-08-31'), '2026-08-01');
  assert.equal(monthStartKey('2027-01-15'), '2027-01-01');
});

// ---------------------------------------------------------------------------
// Mission state: never completed by the clock alone
// ---------------------------------------------------------------------------

check('mission is pending before the scheduled time', () => {
  assert.equal(getMissionState(MISSION, new Date(2026, 7, 12, 13, 59, 59), false), 'pending');
  assert.equal(getMissionState(MISSION, new Date(2026, 7, 12, 0, 0, 0), false), 'pending');
});

check('mission becomes available exactly at the scheduled time', () => {
  assert.equal(getMissionState(MISSION, new Date(2026, 7, 12, 14, 0, 0), false), 'available');
  assert.equal(getMissionState(MISSION, new Date(2026, 7, 12, 23, 59, 59), false), 'available');
});

check('time arrival alone NEVER completes the mission (manual only)', () => {
  // Same instant, but completedToday still must be reported by the user.
  assert.equal(getMissionState(MISSION, new Date(2026, 7, 12, 14, 0, 1), false), 'available');
  assert.equal(getMissionState(MISSION, new Date(2026, 7, 12, 14, 0, 1), true), 'completed');
});

check('completedToday overrides the clock', () => {
  assert.equal(getMissionState(MISSION, new Date(2026, 7, 12, 0, 0, 0), true), 'completed');
});

check('a disabled mission stays pending regardless of time', () => {
  const disabled = { ...MISSION, enabled: false };
  assert.equal(getMissionState(disabled, new Date(2026, 7, 12, 15, 0), false), 'pending');
  assert.equal(getMissionState(disabled, new Date(2026, 7, 12, 15, 0), true), 'completed');
});

check('midnight rolls the mission back to pending for the new day', () => {
  // Completed yesterday does not make today complete.
  assert.equal(toDateKey(new Date(2026, 7, 13, 0, 1)), '2026-08-13');
  assert.equal(getMissionState(MISSION, new Date(2026, 7, 13, 0, 1), false), 'pending');
});

check('timeOfDayToDate resolves against the passed day (DST-safe)', () => {
  const target = timeOfDayToDate(MISSION.scheduledTime, new Date(2026, 7, 12, 10, 0));
  assert.equal(target.getFullYear(), 2026);
  assert.equal(target.getMonth(), 7);
  assert.equal(target.getDate(), 12);
  assert.equal(target.getHours(), 14);
  assert.equal(target.getMinutes(), 0);
});

check('msUntil counts down and clamps to zero', () => {
  const before = new Date(2026, 7, 12, 13, 59, 0);
  assert.equal(msUntil(MISSION.scheduledTime, before), 60_000);
  const after = new Date(2026, 7, 12, 14, 0, 1);
  assert.equal(msUntil(MISSION.scheduledTime, after), 0);
});

// ---------------------------------------------------------------------------
// Near window + display phases + hint text
// ---------------------------------------------------------------------------

check('isNearMissionTime opens exactly MISSION_NEAR_MINUTES before the time', () => {
  const atWindow = new Date(2026, 7, 12, 14, 0);
  atWindow.setSeconds(0);
  atWindow.setMinutes(atWindow.getMinutes() - MISSION_NEAR_MINUTES);
  assert.ok(isNearMissionTime(MISSION, atWindow), 'inside window');
  const justOutside = new Date(2026, 7, 12, 13, 59);
  justOutside.setMinutes(justOutside.getMinutes() - MISSION_NEAR_MINUTES);
  justOutside.setSeconds(59);
  assert.equal(isNearMissionTime(MISSION, justOutside), false, 'outside window');
});

check('isNearMissionTime is false at/after the time and when completed', () => {
  assert.equal(isNearMissionTime(MISSION, new Date(2026, 7, 12, 14, 0, 0), false), false);
  assert.equal(isNearMissionTime(MISSION, new Date(2026, 7, 12, 13, 55), true), false);
});

check('getMissionPhase walks pending → near → available → completed', () => {
  assert.equal(getMissionPhase(MISSION, new Date(2026, 7, 12, 9, 0), false), 'pending');
  assert.equal(getMissionPhase(MISSION, new Date(2026, 7, 12, 13, 55), false), 'near');
  assert.equal(getMissionPhase(MISSION, new Date(2026, 7, 12, 14, 0), false), 'available');
  assert.equal(getMissionPhase(MISSION, new Date(2026, 7, 12, 14, 0), true), 'completed');
});

check('missionHintText matches the required copy', () => {
  assert.equal(
    missionHintText(MISSION, new Date(2026, 7, 12, 9, 0), false),
    'Tu misión estará disponible a las 14:00.',
  );
  // Near keeps the same text; the soft indicator is visual.
  assert.equal(
    missionHintText(MISSION, new Date(2026, 7, 12, 13, 55), false),
    'Tu misión estará disponible a las 14:00.',
  );
  assert.equal(
    missionHintText(MISSION, new Date(2026, 7, 12, 14, 5), false),
    'Tu misión está lista.',
  );
  assert.equal(
    missionHintText(MISSION, new Date(2026, 7, 12, 14, 5), true),
    'MISSION COMPLETE',
  );
});

// ---------------------------------------------------------------------------
// Records: duplicate detection + completion checks
// ---------------------------------------------------------------------------

check('isCompleted reads the record flag only', () => {
  assert.equal(isCompleted(undefined), false);
  assert.equal(isCompleted({ ...rec('2026-08-12'), completed: false }), false);
  assert.equal(isCompleted(rec('2026-08-12')), true);
});

check('hasRecord / findDuplicate / isDuplicateEntry detect a second entry', () => {
  const records = recordsOf('2026-08-12');
  assert.equal(hasRecord(records, '2026-08-12'), true);
  assert.equal(hasRecord(records, '2026-08-13'), false);
  assert.equal(findDuplicate(records, '2026-08-12'), records['2026-08-12']);
  assert.equal(findDuplicate(records, '2026-08-13'), undefined);
  assert.equal(isDuplicateEntry(records, '2026-08-12'), true);
  assert.equal(isDuplicateEntry(records, '2026-08-13'), false);
});

check('isMissionCompletedOn only for the given day', () => {
  const records = recordsOf('2026-08-12');
  assert.equal(isMissionCompletedOn(records, '2026-08-12'), true);
  assert.equal(isMissionCompletedOn(records, '2026-08-13'), false);
});

check('the reducer refuses duplicate completions (same state, first timestamp wins)', () => {
  const base = createDefaultState();
  const action: AppAction = {
    type: 'COMPLETE_TODAY',
    date: '2026-08-12',
    completedAt: '2026-08-12T14:00:00.000Z',
  };
  const first = appReducer(base, action);
  const duplicate = appReducer(first, action);
  assert.equal(first, duplicate, 'duplicate dispatch returns the same state reference');
  // The default state already seeds a "day 1" record (yesterday); today adds one more.
  assert.equal(
    Object.keys(duplicate.records).length,
    Object.keys(base.records).length + 1,
  );
  assert.equal(duplicate.records['2026-08-12'].completedAt, '2026-08-12T14:00:00.000Z');

  const replayed = appReducer(first, {
    type: 'COMPLETE_TODAY',
    date: '2026-08-12',
    completedAt: '2026-08-12T14:00:01.000Z',
  });
  assert.equal(replayed, first, 'timestamp is never overwritten');
});

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

check('countStreakEndingAt counts consecutive completed days', () => {
  const records = recordsOf('2026-08-10', '2026-08-11', '2026-08-12');
  assert.equal(countStreakEndingAt(records, '2026-08-12'), 3);
  assert.equal(countStreakEndingAt(records, '2026-08-11'), 2);
});

check('streaks survive month and year boundaries', () => {
  assert.equal(countStreakEndingAt(recordsOf('2026-01-30', '2026-01-31', '2026-02-01'), '2026-02-01'), 3);
  assert.equal(countStreakEndingAt(recordsOf('2025-12-30', '2025-12-31', '2026-01-01'), '2026-01-01'), 3);
});

check('allowGap tolerates today being still pending', () => {
  const records = recordsOf('2026-08-10', '2026-08-11');
  assert.equal(countStreakEndingAt(records, '2026-08-12', true), 2, 'today gap kept alive');
  assert.equal(countStreakEndingAt(records, '2026-08-12', false), 0, 'strict mode breaks');
  assert.equal(countStreakEndingAt(records, '2026-08-13', true), 0, 'a real gap is not tolerated');
});

check('currentStreak accepts an explicit today key', () => {
  const records = recordsOf('2026-08-10', '2026-08-11');
  assert.equal(currentStreak(records, '2026-08-12'), 2);
  assert.equal(currentStreak(records, '2026-08-11'), 2);
});

check('bestStreak finds the longest run across gaps', () => {
  const records = recordsOf('2026-08-10', '2026-08-11', '2026-08-13', '2026-08-14', '2026-08-15');
  assert.equal(bestStreak(records), 3);
  assert.equal(bestStreak(recordsOf('2026-08-10')), 1);
  assert.equal(bestStreak({}), 0);
});

// ---------------------------------------------------------------------------
// Solín session context
// ---------------------------------------------------------------------------

check('Solín distinguishes first use, regular return and return after a gap', () => {
  const now = new Date(2026, 7, 12, 14, 0);
  assert.equal(getCompanionVisitKind({ visits: 0, lastVisitedAt: null }, now), 'first');
  assert.equal(
    getCompanionVisitKind({ visits: 3, lastVisitedAt: new Date(2026, 7, 11).toISOString() }, now),
    'returning',
  );
  assert.equal(
    getCompanionVisitKind({ visits: 3, lastVisitedAt: new Date(2026, 7, 8).toISOString() }, now),
    'returningAfterGap',
  );
});

check('registering a Solín visit persists context without affecting progress', () => {
  const base = createDefaultState();
  const next = appReducer(base, {
    type: 'REGISTER_COMPANION_VISIT',
    visitedAt: '2026-08-12T14:00:00.000Z',
  });
  assert.equal(next.companion.visits, 1);
  assert.equal(next.companion.lastVisitedAt, '2026-08-12T14:00:00.000Z');
  assert.equal(next.progress.xp, base.progress.xp);
});

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
