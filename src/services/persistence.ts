import type {
  AchievementUnlock,
  AppState,
  DailyRecord,
  DateKey,
  UserProgress,
} from '../types';
import { STORAGE_KEYS, loadJSON, saveJSON } from '../lib/storage';
import { createId } from '../lib/ids';
import { shiftDateKey, toDateKey } from '../lib/date';
import { bestStreak, currentStreak, totalCompleted, totalXp } from './streaks';
import { evaluateNewAchievements } from './achievements';
import { getAchievement } from '../config/achievements';

/** Bump when the persisted schema changes incompatibly. */
export const STATE_VERSION = 2;

/** Default mission: the daily mission at 14:00, enabled. */
export const DEFAULT_MISSION: AppState['mission'] = {
  id: 'mission_daily',
  title: 'MISIÓN DIARIA',
  scheduledTime: '14:00',
  enabled: true,
};

export const DEFAULT_SETTINGS: AppState['settings'] = {
  theme: 'system',
  userName: 'TRISTAN',
};

export const DEFAULT_PROGRESS: UserProgress = {
  currentStreak: 1,
  bestStreak: 0,
  totalCompleted: 1,
  totalDays: 1,
  xp: 0,
  achievementUnlocks: {},
  bonusXp: 0,
};

export const DEFAULT_EVENTS: AppState['events'] = {};

export const DEFAULT_COMPANION: AppState['companion'] = {
  visits: 0,
  lastVisitedAt: null,
};

export function createDefaultState(): AppState {
  const yesterday = shiftDateKey(toDateKey(), -1);
  const startDate = yesterday;
  return {
    version: STATE_VERSION,
    mission: { ...DEFAULT_MISSION, id: createId('mission') },
    records: {
      [yesterday]: {
        date: yesterday,
        completed: true,
        completedAt: new Date().toISOString(),
        xpEarned: 0,
      },
    },
    progress: { 
      ...DEFAULT_PROGRESS,
      startDate 
    },
    settings: { ...DEFAULT_SETTINGS },
    companion: { ...DEFAULT_COMPANION },
    events: { ...DEFAULT_EVENTS },
  };
}

/** Everything `recomputeProgress` needs beyond the raw records. */
export interface ProgressContext {
  mission: AppState['mission'];
  events: AppState['events'];
}

/**
 * Recompute all aggregate progress from the raw records, then unlock any
 * achievements whose conditions are now met (granting their XP).
 * Records are the single source of truth for streaks and mission XP, so
 * displayed progress can't drift; achievement XP is kept separate in
 * `bonusXp` so it never gets overwritten by recomputation.
 */
export function recomputeProgress(
  records: Record<DateKey, DailyRecord>,
  previous: UserProgress,
  context: ProgressContext,
): UserProgress {
  const unlocks = { ...previous.achievementUnlocks };
  // Records are a plain object (never an array), so recompute from them
  // directly: they are the single source of truth for streaks, totals and
  // XP. Empty records simply mean nothing has been completed yet.
  const dayKeys = Object.keys(records ?? {});
  const totalDays = dayKeys.length;
  const computedTotalCompleted = totalCompleted(records);
  const computedCurrentStreak = currentStreak(records);
  const computedBestStreak = bestStreak(records);
  const base: UserProgress = {
    currentStreak: computedCurrentStreak,
    bestStreak: computedBestStreak,
    totalCompleted: computedTotalCompleted,
    totalDays,
    xp: totalXp(records) + previous.bonusXp,
    achievementUnlocks: unlocks,
    bonusXp: previous.bonusXp,
  };

  const newlyEarned = evaluateNewAchievements({
    records,
    progress: base,
    mission: context.mission,
    events: context.events,
  });
  if (newlyEarned.length === 0) return base;

  let bonusXp = previous.bonusXp;
  for (const id of newlyEarned) {
    const def = getAchievement(id);
    if (!def) continue;
    unlocks[id] = {
      unlockedAt: new Date().toISOString(),
      xpEarned: def.xp,
    };
    bonusXp += def.xp;
  }

  return {
    ...base,
    achievementUnlocks: unlocks,
    bonusXp,
    xp: totalXp(records) + bonusXp,
  };
}

/** Build a valid UserProgress from raw persisted values (with migration). */
function normalizeProgress(
  raw: Partial<UserProgress> | null | undefined,
  records: Record<DateKey, DailyRecord>,
  context: ProgressContext,
): UserProgress {
  // Legacy (v1) shape: a plain string[] of unlocked ids.
  const legacyRaw = (raw as { unlockedAchievements?: unknown } | null)?.unlockedAchievements;
  const legacyUnlocks: string[] = Array.isArray(legacyRaw)
    ? (legacyRaw as unknown[]).filter(
        (value): value is string => typeof value === 'string',
      )
    : [];

  const unlocks: Record<string, AchievementUnlock> = {};
  const rawUnlocks = raw?.achievementUnlocks ?? {};
  if (rawUnlocks && typeof rawUnlocks === 'object') {
    for (const [id, value] of Object.entries(rawUnlocks)) {
      const entry = value as { unlockedAt?: string; xpEarned?: number } | undefined;
      if (entry && typeof entry === 'object' && typeof entry.unlockedAt === 'string') {
        unlocks[id] = {
          unlockedAt: entry.unlockedAt,
          xpEarned: Number(entry.xpEarned) || 0,
        };
      }
    }
  }
  for (const id of legacyUnlocks) {
    if (!(id in unlocks)) {
      unlocks[id] = {
        unlockedAt: new Date(0).toISOString(),
        xpEarned: getAchievement(id)?.xp ?? 0,
      };
    }
  }

  const previous: UserProgress = {
    ...DEFAULT_PROGRESS,
    achievementUnlocks: unlocks,
    bonusXp: Object.values(unlocks).reduce((sum, entry) => sum + entry.xpEarned, 0),
    startDate: raw?.startDate,
  };

  return recomputeProgress(records, previous, context);
}

/** Normalize data read from storage: migrate versions and fill gaps. */
export function normalizeState(parsed: Partial<AppState> | null | undefined): AppState {
  const fallback = createDefaultState();

  if (!parsed || typeof parsed !== 'object') return fallback;

  const mission = {
    ...fallback.mission,
    ...(parsed.mission ?? {}),
    id: parsed.mission?.id ?? createId('mission'),
    // Legacy default name → localize.
    title:
      parsed.mission?.title === 'Daily Mission' ? 'MISIÓN DIARIA' : parsed.mission?.title ?? 'MISIÓN DIARIA',
  };

  const records: Record<DateKey, DailyRecord> = {};
  const rawRecords = parsed.records ?? {};
  for (const [key, value] of Object.entries(rawRecords)) {
    if (value && typeof value === 'object' && 'completed' in value) {
      records[key] = {
        date: key,
        completed: Boolean(value.completed),
        completedAt: value.completedAt ?? null,
        xpEarned: Number(value.xpEarned) || 0,
      };
    }
  }

  const events: AppState['events'] = {};
  if (parsed.events && typeof parsed.events === 'object') {
    for (const [key, value] of Object.entries(parsed.events)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        events[key] = value;
      }
    }
  }

  const progress = normalizeProgress(parsed.progress, records, { mission, events });
  const rawCompanion = parsed.companion;
  const companion = {
    visits:
      typeof rawCompanion?.visits === 'number' && Number.isFinite(rawCompanion.visits)
        ? Math.max(0, Math.floor(rawCompanion.visits))
        : 0,
    lastVisitedAt:
      typeof rawCompanion?.lastVisitedAt === 'string' &&
      !Number.isNaN(new Date(rawCompanion.lastVisitedAt).getTime())
        ? rawCompanion.lastVisitedAt
        : null,
  };

  return {
    version: STATE_VERSION,
    mission,
    records,
    progress,
    settings: {
      theme: parsed.settings?.theme ?? 'system',
      userName: parsed.settings?.userName?.trim() || 'TRISTAN',
    },
    companion,
    events,
  };
}

/** Load and normalize persisted state. */
export function loadState(): AppState {
  const parsed = loadJSON<Partial<AppState> | null>(STORAGE_KEYS.appState, null);
  return normalizeState(parsed);
}

/** Persist the full app state. Returns true on success. */
export function saveState(state: AppState): boolean {
  try {
    saveJSON(STORAGE_KEYS.appState, state);
    return true;
  } catch {
    return false;
  }
}
