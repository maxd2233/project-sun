/**
 * XP economy rules. Centralised so tuning feels like tweaking constants.
 * No game-feel decisions live scattered across components.
 */

/** Base XP for completing a single daily mission. */
export const BASE_XP = 100;

/** Additional XP per day of active streak, capped. */
export const STREAK_BONUS_XP = 10;

/** Streak length beyond which the bonus stops growing. */
export const STREAK_BONUS_CAP = 10;

/**
 * XP awarded for completing today's mission given the streak the player
 * is entering. `streakAfterCompletion` should already include today.
 */
export function xpForCompletion(streakAfterCompletion: number): number {
  const bonus =
    Math.min(streakAfterCompletion - 1, STREAK_BONUS_CAP - 1) * STREAK_BONUS_XP;
  return BASE_XP + Math.max(0, bonus);
}
