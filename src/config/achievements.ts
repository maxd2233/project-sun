import type { LucideIcon } from 'lucide-react';
import {
  AlarmClock,
  Award,
  Bird,
  Brain,
  CalendarDays,
  Crown,
  Footprints,
  Layers,
  Moon,
  Rocket,
  RotateCcw,
  ShieldCheck,
  SunMedium,
  Target,
  Zap,
} from 'lucide-react';
import type {
  AchievementCategory,
  AchievementRarity,
  DateKey,
  DailyRecord,
  Mission,
  UserProgress,
} from '../types';
import { daysBetween, fromDateKey } from '../lib/date';

/**
 * Achievement catalogue. Pure data: every condition is a predicate over
 * real, persisted app data (records, progress, events) — never random.
 * Edit freely; ids must stay stable (they are persisted).
 */

/** Everything a condition may look at. All of it is deterministic. */
export interface AchievementContext {
  records: Record<DateKey, DailyRecord>;
  progress: UserProgress;
  mission: Mission;
  /** Counted in-app events (e.g. how often the Logros page was opened). */
  events: Record<string, number>;
}

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  /** What the player has to do, shown on locked cards. */
  requirement: string;
  icon: LucideIcon;
  rarity: AchievementRarity;
  /** XP granted the moment the achievement unlocks. */
  xp: number;
  /** True once the player earns this achievement. */
  unlocked: (ctx: AchievementContext) => boolean;
}

/** Display view of an achievement plus its (optional) unlock timestamp. */
export interface Achievement extends AchievementDef {
  unlockedAt: string | null;
}

/** Event counters the catalogue reads. */
export const ACHIEVEMENT_EVENTS = {
  achievementsPageViews: 'achievements_page_views',
} as const;

const completedRecords = (records: Record<DateKey, DailyRecord>): DailyRecord[] =>
  Object.keys(records)
    .filter((key) => records[key].completed)
    .sort()
    .map((key) => records[key]);

const completedKeys = (records: Record<DateKey, DailyRecord>): DateKey[] =>
  Object.keys(records)
    .filter((key) => records[key].completed)
    .sort();

/** Absolute minutes between a completion and the scheduled time, or null. */
function minutesFromScheduled(record: DailyRecord, mission: Mission): number | null {
  if (!record.completedAt) return null;
  const completed = new Date(record.completedAt);
  const [hours, minutes] = mission.scheduledTime.split(':').map(Number);
  const scheduled = new Date(completed);
  scheduled.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return Math.abs((completed.getTime() - scheduled.getTime()) / 60_000);
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // ---------- CONSTANCIA ----------
  {
    id: 'first_step',
    category: 'constancia',
    title: 'Primer paso',
    description: 'La primera misión cumplida de tu historia.',
    requirement: 'Completá la misión por primera vez.',
    icon: Footprints,
    rarity: 'common',
    xp: 50,
    unlocked: (ctx) => ctx.progress.totalCompleted >= 1,
  },
  {
    id: 'week_solar',
    category: 'constancia',
    title: 'Una semana',
    description: 'Siete días seguidos bajo el sol.',
    requirement: 'Completá la misión 7 días consecutivos.',
    icon: SunMedium,
    rarity: 'uncommon',
    xp: 100,
    unlocked: (ctx) => ctx.progress.bestStreak >= 7,
  },
  {
    id: 'unstoppable',
    category: 'constancia',
    title: 'Imparable',
    description: 'Dos semanas sin aflojar.',
    requirement: 'Completá la misión 14 días consecutivos.',
    icon: Zap,
    rarity: 'rare',
    xp: 150,
    unlocked: (ctx) => ctx.progress.bestStreak >= 14,
  },
  {
    id: 'steady',
    category: 'constancia',
    title: 'Constante',
    description: 'Treinta días de misión cumplida.',
    requirement: 'Sumá 30 días completados.',
    icon: ShieldCheck,
    rarity: 'epic',
    xp: 250,
    unlocked: (ctx) => ctx.progress.totalCompleted >= 30,
  },
  {
    id: 'legend',
    category: 'constancia',
    title: 'Leyenda',
    description: 'Cien días brillando.',
    requirement: 'Sumá 100 días completados.',
    icon: Crown,
    rarity: 'legendary',
    xp: 500,
    unlocked: (ctx) => ctx.progress.totalCompleted >= 100,
  },
  {
    id: 'year_full',
    category: 'constancia',
    title: 'Año completo',
    description: 'Un año entero de constancia.',
    requirement: 'Sumá 365 días completados.',
    icon: CalendarDays,
    rarity: 'legendary',
    xp: 500,
    unlocked: (ctx) => ctx.progress.totalCompleted >= 365,
  },

  // ---------- PRECISIÓN ----------
  {
    id: 'sniper',
    category: 'precision',
    title: 'Francotirador',
    description: 'Cumpliste a la hora exacta. Ni un minuto de más.',
    requirement: 'Completá la misión a 2 minutos o menos de la hora programada.',
    icon: Target,
    rarity: 'rare',
    xp: 150,
    unlocked: (ctx) =>
      completedRecords(ctx.records).some(
        (r) => (minutesFromScheduled(r, ctx.mission) ?? Infinity) <= 2,
      ),
  },
  {
    id: 'punctual',
    category: 'precision',
    title: 'Puntual',
    description: 'Cinco misiones cumplidas casi a tiempo.',
    requirement: 'Completá 5 misiones a 30 minutos o menos de la hora programada.',
    icon: AlarmClock,
    rarity: 'uncommon',
    xp: 100,
    unlocked: (ctx) =>
      completedRecords(ctx.records).filter(
        (r) => (minutesFromScheduled(r, ctx.mission) ?? Infinity) <= 30,
      ).length >= 5,
  },

  // ---------- DIVERTIDOS ----------
  {
    id: 'speedrun',
    category: 'divertidos',
    title: 'Speedrun',
    description: 'Misión completada en menos de un minuto.',
    requirement: 'Completá la misión dentro del primer minuto de habilitada.',
    icon: Rocket,
    rarity: 'epic',
    xp: 250,
    unlocked: (ctx) =>
      completedRecords(ctx.records).some((r) => {
        if (!r.completedAt) return false;
        const completed = new Date(r.completedAt);
        const [hours, minutes] = ctx.mission.scheduledTime.split(':').map(Number);
        const scheduled = new Date(completed);
        scheduled.setHours(hours ?? 0, minutes ?? 0, 0, 0);
        const diff = (completed.getTime() - scheduled.getTime()) / 60_000;
        return diff >= 0 && diff <= 1;
      }),
  },
  {
    id: 'combo_x7',
    category: 'divertidos',
    title: 'Combo x7',
    description: 'Una semana entera cumpliendo casi a la hora.',
    requirement: 'Completá 7 días seguidos, cada uno a 30 minutos o menos de la hora programada.',
    icon: Layers,
    rarity: 'legendary',
    xp: 500,
    unlocked: (ctx) => {
      let run = 0;
      let best = 0;
      let previous: DateKey | null = null;
      for (const key of completedKeys(ctx.records)) {
        const within =
          (minutesFromScheduled(ctx.records[key], ctx.mission) ?? Infinity) <= 30;
        const consecutive = previous !== null && daysBetween(previous, key) === 1;
        run = within && consecutive ? run + 1 : within ? 1 : 0;
        best = Math.max(best, run);
        previous = key;
      }
      return best >= 7;
    },
  },
  {
    id: 'duck_watches',
    category: 'divertidos',
    title: 'El pato te observa',
    description: 'Sí, ese pato. Estuvo ahí todo el tiempo.',
    requirement: 'Volvé a visitar la pantalla de logros 5 veces. El pato te está mirando.',
    icon: Bird,
    rarity: 'rare',
    xp: 150,
    unlocked: (ctx) =>
      (ctx.events[ACHIEVEMENT_EVENTS.achievementsPageViews] ?? 0) >= 5,
  },
  {
    id: 'council_of_elders',
    category: 'divertidos',
    title: 'El consejo de ancianos',
    description: 'Mil puntos de experiencia. Los mayores te reciben.',
    requirement: 'Alcanzá los 1.000 XP totales.',
    icon: Award,
    rarity: 'epic',
    xp: 250,
    unlocked: (ctx) => ctx.progress.xp >= 1000,
  },
  {
    id: 'survived_monday',
    category: 'divertidos',
    title: 'Sobreviviste al lunes',
    description: 'El día más temido del calendario, superado.',
    requirement: 'Completá la misión un lunes.',
    icon: Brain,
    rarity: 'uncommon',
    xp: 100,
    unlocked: (ctx) =>
      completedKeys(ctx.records).some((key) => fromDateKey(key).getDay() === 1),
  },
  {
    id: 'night_mode',
    category: 'divertidos',
    title: 'Modo nocturno',
    description: 'Misiones de madrugada. El sol aplaude tu entusiasmo.',
    requirement: 'Completá la misión entre las 21:00 y las 05:00.',
    icon: Moon,
    rarity: 'rare',
    xp: 150,
    unlocked: (ctx) =>
      completedRecords(ctx.records).some((r) => {
        if (!r.completedAt) return false;
        const hour = new Date(r.completedAt).getHours();
        return hour >= 21 || hour < 5;
      }),
  },
  {
    id: 'back_again',
    category: 'divertidos',
    title: '¿Otra vez acá?',
    description: 'Te fuiste un día… y volviste. Nos alegra mucho.',
    requirement: 'Completá la misión después de haberte salteado al menos un día.',
    icon: RotateCcw,
    rarity: 'uncommon',
    xp: 100,
    unlocked: (ctx) => {
      const keys = completedKeys(ctx.records);
      for (let i = 1; i < keys.length; i += 1) {
        if (daysBetween(keys[i - 1], keys[i]) > 1) return true;
      }
      return false;
    },
  },
];

/** Lookup for a single achievement by id. */
export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Build the display model (def + unlock status) for a persisted id. */
export function achievementWithStatus(
  id: string,
  unlockedAt: string | null,
): Achievement | undefined {
  const def = getAchievement(id);
  return def ? { ...def, unlockedAt } : undefined;
}

/** Display metadata for each rarity. */
export const RARITY_META: Record<
  AchievementRarity,
  { label: string; className: string }
> = {
  common: { label: 'Común', className: 'ach-rarity--common' },
  uncommon: { label: 'Poco común', className: 'ach-rarity--uncommon' },
  rare: { label: 'Raro', className: 'ach-rarity--rare' },
  epic: { label: 'Épico', className: 'ach-rarity--epic' },
  legendary: { label: 'Legendario', className: 'ach-rarity--legendary' },
};

/** Category metadata used to group the achievements screen. */
export const ACHIEVEMENT_CATEGORIES: readonly {
  id: AchievementCategory;
  label: string;
  description: string;
}[] = [
  {
    id: 'constancia',
    label: 'Constancia',
    description: 'Rachas y días completados. El motor del juego.',
  },
  {
    id: 'precision',
    label: 'Precisión',
    description: 'Cumplir cerca de la hora programada.',
  },
  {
    id: 'divertidos',
    label: 'Divertidos',
    description: 'Curiosidades, secretos y guiños.',
  },
];
