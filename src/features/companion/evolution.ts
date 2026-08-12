/**
 * Solín's evolution stages.
 *
 * Purely data-driven and extensible: each stage describes how Solín looks
 * (rays, aura, sparkles, accessories, size). Add a new entry to
 * `COMPANION_STAGES` and the companion renders that form automatically.
 *
 * The stage is derived from completed missions ("días"), which mirrors the
 * player's constancy. All thresholds live in `minCompleted` / `maxCompleted`.
 */

export type CompanionStageId =
  | 'bebe'
  | 'despierto'
  | 'energetico'
  | 'solar'
  | 'legendario';

export interface CompanionStage {
  id: CompanionStageId;
  name: string;
  /** Completed missions needed to reach this stage (inclusive). */
  minCompleted: number;
  /** Inclusive upper bound; `null` means no limit (final stage). */
  maxCompleted: number | null;
  /** Body scale multiplier applied to the artwork. */
  scale: number;
  /** Number of short rays around the body (0 = none). */
  rays: number;
  /** Aura style rendered behind the body. */
  aura: 'none' | 'glow' | 'ring' | 'legend';
  /** Count of orbiting sparkle particles. */
  sparkles: number;
  /** Wear the legendary crown. */
  crown?: boolean;
  /** Rosy cheeks (babies blush). */
  blush?: boolean;
}

export const COMPANION_STAGES: readonly CompanionStage[] = [
  {
    id: 'bebe',
    name: 'Solín bebé',
    minCompleted: 0,
    maxCompleted: 6,
    scale: 0.78,
    rays: 0,
    aura: 'none',
    sparkles: 0,
    blush: true,
  },
  {
    id: 'despierto',
    name: 'Solín despierto',
    minCompleted: 7,
    maxCompleted: 13,
    scale: 0.88,
    rays: 8,
    aura: 'glow',
    sparkles: 0,
    blush: true,
  },
  {
    id: 'energetico',
    name: 'Solín energético',
    minCompleted: 14,
    maxCompleted: 29,
    scale: 0.96,
    rays: 10,
    aura: 'glow',
    sparkles: 2,
    blush: false,
  },
  {
    id: 'solar',
    name: 'Solín solar',
    minCompleted: 30,
    maxCompleted: 99,
    scale: 1.05,
    rays: 12,
    aura: 'ring',
    sparkles: 4,
    blush: false,
  },
  {
    id: 'legendario',
    name: 'Solín legendario',
    minCompleted: 100,
    maxCompleted: null,
    scale: 1.12,
    rays: 14,
    aura: 'legend',
    sparkles: 6,
    crown: true,
    blush: false,
  },
];

/** The stage Solín is in given the total completed days. */
export function getCompanionStage(totalCompleted: number): CompanionStage {
  for (let i = COMPANION_STAGES.length - 1; i >= 0; i -= 1) {
    const stage = COMPANION_STAGES[i];
    if (totalCompleted >= stage.minCompleted) return stage;
  }
  return COMPANION_STAGES[0];
}

export interface StageProgress {
  stage: CompanionStage;
  /** The next stage, or null when already at the final form. */
  next: CompanionStage | null;
  totalCompleted: number;
  /** 0..1 progress toward the next stage. */
  progress: number;
  /** Days remaining until the next stage, or null at max. */
  daysToNext: number | null;
}

/** Everything the UI needs to show the current form and the road ahead. */
export function getStageProgress(totalCompleted: number): StageProgress {
  const stage = getCompanionStage(totalCompleted);
  const index = COMPANION_STAGES.findIndex((s) => s.id === stage.id);
  const next = COMPANION_STAGES[index + 1] ?? null;

  const daysToNext = next ? Math.max(0, next.minCompleted - totalCompleted) : null;
  const span = next ? next.minCompleted - stage.minCompleted : 0;
  const progress = next
    ? Math.min(1, Math.max(0, (totalCompleted - stage.minCompleted) / span))
    : 1;

  return { stage, next, totalCompleted, progress, daysToNext };
}
