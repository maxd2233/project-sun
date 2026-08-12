/**
 * Core domain types for Project Sun.
 * All user data stays on-device; nothing here represents clinical or
 * medical information.
 */

/** A calendar day, local timezone, formatted as `YYYY-MM-DD`. */
export type DateKey = string;

/** Time of day in 24h `HH:mm` format (local). */
export type TimeOfDay = string;

/** The single daily mission the user configures. */
export interface Mission {
  id: string;
  title: string;
  /** Local time of day the mission is scheduled for, e.g. `"14:00"`. */
  scheduledTime: TimeOfDay;
  enabled: boolean;
}

/** A single day's outcome. At most one record exists per DateKey. */
export interface DailyRecord {
  date: DateKey;
  completed: boolean;
  /** ISO timestamp of when the mission was completed. */
  completedAt: string | null;
  /** XP awarded for this day's completion. */
  xpEarned: number;
}

/** Which group an achievement belongs to (used to organise the screen). */
export type AchievementCategory = 'constancia' | 'precision' | 'divertidos';

/** How rare an achievement is; drives its visual treatment. */
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** What persisted when an achievement was earned. */
export interface AchievementUnlock {
  /** ISO timestamp of when it was earned. */
  unlockedAt: string;
  /** XP granted for this unlock. */
  xpEarned: number;
}

/**
 * Aggregated player-style progress.
 * Mostly derived from records; persisted so it can be shown instantly
 * and evolve with future game mechanics.
 */
export interface UserProgress {
  currentStreak: number;
  bestStreak: number;
  totalCompleted: number;
  totalDays: number;
  /** Total XP = mission XP (from records) + `bonusXp` (from achievements). */
  xp: number;
  /** Achievement unlocks keyed by achievement id. */
  achievementUnlocks: Record<string, AchievementUnlock>;
  /** XP earned from achievements, kept separate so it can't drift. */
  bonusXp: number;
  /** DateKey of the app's "first day" — used to compute which day number
   *  the app is currently on. startDate = yesterday means: yesterday = Day 1,
   *  today = Day 2, tomorrow = Day 3, etc. Persisted across sessions. */
  startDate?: DateKey;
}

/** Appearance preference. `system` follows the OS setting. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** App-level user preferences (no analytics, nothing leaves the device). */
export interface Settings {
  theme: ThemePreference;
  /** Display name shown on the home screen, e.g. "TRISTAN". */
  userName: string;
}

/** Small local memory used only to make Solín's greetings contextual. */
export interface CompanionMemory {
  /** Number of application sessions Solín has greeted locally. */
  visits: number;
  /** ISO timestamp of the previous application session, if any. */
  lastVisitedAt: string | null;
}

/** The persisted application state. */
export interface AppState {
  version: number;
  mission: Mission;
  /** Records keyed by local DateKey. */
  records: Record<DateKey, DailyRecord>;
  progress: UserProgress;
  settings: Settings;
  companion: CompanionMemory;
  /** Counters for real in-app events (some achievements depend on them). */
  events: Record<string, number>;
}

/** Where today's mission stands relative to its scheduled time. */
export type MissionState = 'pending' | 'available' | 'completed';

/** Defines which top-level section is shown. */
export type SectionId =
  | 'today'
  | 'streaks'
  | 'achievements'
  | 'calendar'
  | 'settings';

export interface SectionDefinition {
  id: SectionId;
  label: string;
  /** lucide-react icon name used by the nav. */
  icon: 'sun' | 'flame' | 'trophy' | 'calendar' | 'settings';
  title: string;
}
