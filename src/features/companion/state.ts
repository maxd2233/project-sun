import type { CompanionMemory, MissionState } from '../../types';
import type { DaySegment } from '../../lib/date';

/**
 * Solín's visible moods. Base moods are derived from the mission + time of
 * day; `celebrating` and `unlocking` are short transient reactions layered
 * on top (e.g. right after completing the mission or earning an achievement).
 */
export type CompanionMood =
  | 'idle' // waiting for the scheduled time
  | 'waiting' // mission available but not done
  | 'happy' // mission done today
  | 'celebrating' // transient: completion burst
  | 'unlocking' // transient: achievement earned
  | 'resting' // night + mission not done (Solín sleeps)
  | 'night'; // night + mission done (Solín awake under the moon)

/** True when the current clock segment is night (20:00–05:59). */
export function isNightSegment(segment: DaySegment): boolean {
  return segment === 'night';
}

/**
 * Base (non-transient) mood from the mission state machine and the clock.
 * Priority: completion → night habits → pending/available.
 */
export function getCompanionBaseMood(
  missionState: MissionState,
  segment: DaySegment,
): CompanionMood {
  const night = isNightSegment(segment);
  if (missionState === 'completed') return night ? 'night' : 'happy';
  if (night) return 'resting';
  if (missionState === 'available') return 'waiting';
  return 'idle';
}

/** Combine a transient reaction with the base mood (transient wins). */
export function getEffectiveMood(
  base: CompanionMood,
  transient: CompanionMood | null,
): CompanionMood {
  return transient ?? base;
}

/** Greeting context derived from the persisted local session memory. */
export type CompanionVisitKind = 'first' | 'returning' | 'returningAfterGap';

export function getCompanionVisitKind(
  memory: CompanionMemory,
  now: Date,
): CompanionVisitKind {
  if (memory.visits === 0 || memory.lastVisitedAt === null) return 'first';
  const previous = new Date(memory.lastVisitedAt);
  const daysAway = Math.floor((now.getTime() - previous.getTime()) / 86_400_000);
  return daysAway >= 3 ? 'returningAfterGap' : 'returning';
}
