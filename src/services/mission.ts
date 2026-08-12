import type { Mission, MissionState } from '../types';
import { msUntil, timeOfDayToDate } from '../lib/date';
import { COMPLETE_LABEL } from '../config/messages';

/**
 * Today's mission state machine:
 * - `pending`    → scheduled time not reached yet (locked)
 * - `available`  → scheduled time passed, still not completed (can act)
 * - `completed`  → already completed today
 *
 * Arriving at the scheduled time NEVER completes the mission by itself:
 * `available` only means the button can be pressed — the user must register
 * the completion manually.
 */
export function getMissionState(
  mission: Mission,
  now: Date,
  completedToday: boolean,
): MissionState {
  if (completedToday) return 'completed';
  if (!mission.enabled) return 'pending';
  const isBefore = now.getTime() < timeOfDayToDate(mission.scheduledTime, now).getTime();
  return isBefore ? 'pending' : 'available';
}

export const MISSION_STATE_LABEL: Record<MissionState, string> = {
  pending: 'PENDIENTE',
  available: 'DISPONIBLE',
  completed: 'COMPLETADA',
};

/**
 * Display phase. `near` is a `pending` mission whose scheduled time is
 * close — used to show a soft "it's almost time" indicator without
 * changing the actual lock state.
 */
export type MissionPhase = 'pending' | 'near' | 'available' | 'completed';

/** How many minutes before the scheduled time the "near" phase starts. */
export const MISSION_NEAR_MINUTES = 10;

/** True while the mission is pending and within the near window. */
export function isNearMissionTime(
  mission: Mission,
  now: Date,
  completedToday = false,
): boolean {
  if (completedToday) return false;
  const remaining = msUntil(mission.scheduledTime, now);
  return remaining > 0 && remaining <= MISSION_NEAR_MINUTES * 60_000;
}

/** The display phase for a mission at a given instant. */
export function getMissionPhase(
  mission: Mission,
  now: Date,
  completedToday: boolean,
): MissionPhase {
  const state = getMissionState(mission, now, completedToday);
  if (state === 'completed') return 'completed';
  if (state === 'available') return 'available';
  return isNearMissionTime(mission, now, completedToday) ? 'near' : 'pending';
}

export const MISSION_PHASE_LABEL: Record<MissionPhase, string> = {
  pending: 'PENDIENTE',
  near: '¡YA CASI!',
  available: 'DISPONIBLE',
  completed: 'COMPLETADA',
};

/**
 * The one-line status text for the mission card.
 * Time values are local and only used here for presentation — the stored
 * timestamps always stay as full ISO instants.
 */
export function missionHintText(
  mission: Mission,
  now: Date,
  completedToday: boolean,
): string {
  const state = getMissionState(mission, now, completedToday);
  if (state === 'completed') return COMPLETE_LABEL;
  if (state === 'available') return 'Tu misión está lista.';
  return `Tu misión estará disponible a las ${mission.scheduledTime}.`;
}
