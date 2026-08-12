import type { AchievementContext } from '../config/achievements';
import { ACHIEVEMENTS } from '../config/achievements';

/**
 * Return the ids of achievements whose conditions are now met but that
 * haven't been recorded as unlocked yet. Deterministic: it only reads the
 * persisted context passed in.
 */
export function evaluateNewAchievements(ctx: AchievementContext): string[] {
  const already = new Set(Object.keys(ctx.progress.achievementUnlocks));
  const earned: string[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!already.has(achievement.id) && achievement.unlocked(ctx)) {
      earned.push(achievement.id);
    }
  }
  return earned;
}
