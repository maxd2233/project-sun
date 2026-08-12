import { strict as assert } from 'node:assert';
import {
  ACHIEVEMENTS,
  getAchievement,
  type AchievementContext,
} from '../src/config/achievements';
import type { DailyRecord, Mission, UserProgress } from '../src/types';
import { evaluateNewAchievements } from '../src/services/achievements';
import {
  DEFAULT_PROGRESS,
  normalizeState,
  recomputeProgress,
} from '../src/services/persistence';

const MISSION: Mission = {
  id: 'mission_daily',
  title: 'MISIÓN DIARIA',
  scheduledTime: '14:00',
  enabled: true,
};

/** ISO timestamp for `dateKey` at scheduled time + `minutesOffset`. */
function completion(dateKey: string, minutesOffset: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = MISSION.scheduledTime.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  dt.setTime(dt.getTime() + minutesOffset * 60_000);
  return dt.toISOString();
}

function rec(dateKey: string, minutesOffset: number | null): DailyRecord {
  return {
    date: dateKey,
    completed: true,
    completedAt: minutesOffset === null ? null : completion(dateKey, minutesOffset),
    xpEarned: 100,
  };
}

function recordsFor(days: number, minutesOffset = 30): Record<string, DailyRecord> {
  const out: Record<string, DailyRecord> = {};
  const cursor = '2026-01-01';
  for (let i = 0; i < days; i += 1) {
    const [y, m, d] = cursor.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + i);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    out[key] = rec(key, minutesOffset);
  }
  return out;
}

/**
 * Aggregates computed from records the way the app does, but with no
 * unlocks recorded yet — so the catalogue conditions can be evaluated
 * in isolation (conditions read progress, which the app always keeps fresh).
 */
function baseProgress(records: Record<string, DailyRecord>): UserProgress {
  const computed = recomputeProgress(records, DEFAULT_PROGRESS, {
    mission: MISSION,
    events: {},
  });
  return {
    ...computed,
    achievementUnlocks: {},
    bonusXp: 0,
  };
}

function ctx(
  records: Record<string, DailyRecord>,
  events: Record<string, number> = {},
  progress?: UserProgress,
): AchievementContext {
  return { records, progress: progress ?? baseProgress(records), mission: MISSION, events };
}

function unlockedIds(c: AchievementContext): string[] {
  return evaluateNewAchievements(c).sort();
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

console.log(`Catalogue has ${ACHIEVEMENTS.length} achievements (expected 15)`);
assert.equal(ACHIEVEMENTS.length, 15);

check('empty context unlocks nothing', () => {
  assert.deepEqual(unlockedIds(ctx({})), []);
});

check('first completion unlocks Primer paso', () => {
  const ids = unlockedIds(ctx({ '2026-01-01': rec('2026-01-01', 0) }));
  assert.ok(ids.includes('first_step'));
});

check('7 consecutive days unlock Una semana', () => {
  const ids = unlockedIds(ctx(recordsFor(7, 0)));
  assert.ok(ids.includes('week_solar'));
  assert.ok(ids.includes('first_step'));
});

check('14 consecutive days unlock Imparable', () => {
  const ids = unlockedIds(ctx(recordsFor(14, 0)));
  assert.ok(ids.includes('unstoppable'));
});

check('30 / 100 / 365 days unlock Constante / Leyenda / Año completo', () => {
  const a30 = unlockedIds(ctx(recordsFor(30, 0)));
  const a100 = unlockedIds(ctx(recordsFor(100, 0)));
  const a365 = unlockedIds(ctx(recordsFor(365, 0)));
  assert.ok(a30.includes('steady'));
  assert.ok(a100.includes('legend'));
  assert.ok(a365.includes('year_full'));
});

check('Francotirador unlocks when within 2 minutes', () => {
  const ids = unlockedIds(ctx({ '2026-01-01': rec('2026-01-01', 1) }));
  assert.ok(ids.includes('sniper'));
});

check('Francotirador does NOT unlock 10 minutes off', () => {
  const ids = unlockedIds(ctx({ '2026-01-01': rec('2026-01-01', 10) }));
  assert.ok(!ids.includes('sniper'));
});

check('Puntual unlocks after 5 completions within 30 minutes', () => {
  const ids = unlockedIds(ctx(recordsFor(5, 15)));
  assert.ok(ids.includes('punctual'));
});

check('Speedrun unlocks when completed under 1 minute after unlock', () => {
  const ids = unlockedIds(ctx({ '2026-01-01': rec('2026-01-01', 0.5) }));
  assert.ok(ids.includes('speedrun'));
});

check('Combo x7 unlocks with 7 consecutive precise days', () => {
  const ids = unlockedIds(ctx(recordsFor(7, 10)));
  assert.ok(ids.includes('combo_x7'));
});

check('Combo x7 does NOT unlock with imprecise days', () => {
  const ids = unlockedIds(ctx(recordsFor(7, 45)));
  assert.ok(!ids.includes('combo_x7'));
});

check('Survive el lunes: completion on a Monday', () => {
  const ids = unlockedIds(ctx({ '2026-01-05': rec('2026-01-05', 0) })); // Monday
  assert.ok(ids.includes('survived_monday'));
});

check('Modo nocturno: completion between 21:00 and 05:00', () => {
  const key = '2026-01-01';
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 23, 0, 0, 0);
  const record: DailyRecord = {
    date: key,
    completed: true,
    completedAt: dt.toISOString(),
    xpEarned: 100,
  };
  const ids = unlockedIds(ctx({ [key]: record }));
  assert.ok(ids.includes('night_mode'));
});

check('¿Otra vez acá?: returning after a skipped day', () => {
  const ids = unlockedIds(
    ctx({
      '2026-01-01': rec('2026-01-01', 0),
      '2026-01-03': rec('2026-01-03', 0),
    }),
  );
  assert.ok(ids.includes('back_again'));
});

check('¿Otra vez acá? NOT unlocked without a gap', () => {
  const ids = unlockedIds(ctx(recordsFor(3, 0)));
  assert.ok(!ids.includes('back_again'));
});

check('El consejo de ancianos at 1000 XP', () => {
  const progress = { ...DEFAULT_PROGRESS, xp: 1000 };
  const ids = unlockedIds(ctx({}, {}, progress));
  assert.ok(ids.includes('council_of_elders'));
});

check('El pato te observa after 5 page visits', () => {
  const ids = unlockedIds(ctx({}, { achievements_page_views: 5 }));
  assert.ok(ids.includes('duck_watches'));
});

check('unlocks are idempotent once persisted', () => {
  const c = ctx({ '2026-01-01': rec('2026-01-01', 0) });
  const once = evaluateNewAchievements(c);
  const already = { ...DEFAULT_PROGRESS, achievementUnlocks: { first_step: { unlockedAt: new Date().toISOString(), xpEarned: 50 } } };
  const twice = evaluateNewAchievements({ ...c, progress: already });
  assert.equal(twice.includes('first_step'), false);
  assert.ok(once.length > 0);
});

check('recomputeProgress unlocks and grants XP once', () => {
  // 45 minutes off: only the constancy achievement can trigger.
  const records = { '2026-01-01': rec('2026-01-01', 45) };
  const first = recomputeProgress(records, DEFAULT_PROGRESS, { mission: MISSION, events: {} });
  assert.equal(first.totalCompleted, 1);
  assert.ok('first_step' in first.achievementUnlocks);
  assert.equal(first.bonusXp, 50);
  assert.equal(first.xp, 100 + 50);
  const second = recomputeProgress(records, first, { mission: MISSION, events: {} });
  assert.equal(second.bonusXp, 50);
  assert.equal(second.xp, 100 + 50);
  assert.equal(Object.keys(second.achievementUnlocks).length, 1);
});

check('normalizeState migrates legacy v1 unlockedAchievements list', () => {
  const legacy = {
    version: 1,
    mission: MISSION,
    records: { '2026-01-01': rec('2026-01-01', 45) },
    settings: { theme: 'system', userName: 'TRISTAN' },
    progress: {
      currentStreak: 0,
      bestStreak: 0,
      totalCompleted: 1,
      totalDays: 1,
      xp: 100,
      unlockedAchievements: ['first_step'],
    },
  };
  const state = normalizeState(legacy as never);
  assert.equal(state.version, 2);
  assert.ok(state.progress.achievementUnlocks.first_step);
  assert.equal(state.progress.achievementUnlocks.first_step.xpEarned, 50);
  assert.equal(state.progress.bonusXp, 50);
  assert.equal(typeof state.events, 'object');
});

check('normalizeState handles a v2 state without losing events', () => {
  const state = normalizeState({
    version: 2,
    mission: MISSION,
    records: {},
    settings: { theme: 'system', userName: 'TRISTAN' },
    events: { achievements_page_views: 4 },
    progress: { ...DEFAULT_PROGRESS },
  } as never);
  assert.equal(state.events.achievements_page_views, 4);
});

check('every achievement id resolves and has a unique id', () => {
  const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
  assert.equal(ids.size, ACHIEVEMENTS.length);
  for (const a of ACHIEVEMENTS) {
    assert.ok(getAchievement(a.id), `missing lookup for ${a.id}`);
    assert.ok(a.title.trim().length > 0);
    assert.ok(a.requirement.trim().length > 0);
    assert.ok(a.xp > 0);
  }
});

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
