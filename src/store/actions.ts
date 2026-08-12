import type { DateKey, Mission, ThemePreference } from '../types';
import type { AppState } from '../types';

export type AppAction =
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'COMPLETE_TODAY'; date: DateKey; completedAt: string }
  | { type: 'UNDO_TODAY'; date: DateKey }
  | { type: 'UPDATE_MISSION'; mission: Partial<Mission> }
  | { type: 'SET_THEME'; theme: ThemePreference }
  | { type: 'SET_USER_NAME'; userName: string }
  | { type: 'REGISTER_COMPANION_VISIT'; visitedAt: string }
  | { type: 'INCREMENT_EVENT'; key: string }
  | { type: 'RESET_ALL' };

export const completeToday = (date: DateKey): AppAction => ({
  type: 'COMPLETE_TODAY',
  date,
  completedAt: new Date().toISOString(),
});

export const undoToday = (date: DateKey): AppAction => ({
  type: 'UNDO_TODAY',
  date,
});

export const updateMission = (mission: Partial<Mission>): AppAction => ({
  type: 'UPDATE_MISSION',
  mission,
});

export const setTheme = (theme: ThemePreference): AppAction => ({
  type: 'SET_THEME',
  theme,
});

export const setUserName = (userName: string): AppAction => ({
  type: 'SET_USER_NAME',
  userName,
});

/** Records an app session for Solín's local, contextual greetings. */
export const registerCompanionVisit = (): AppAction => ({
  type: 'REGISTER_COMPANION_VISIT',
  visitedAt: new Date().toISOString(),
});

export const incrementEvent = (key: string): AppAction => ({
  type: 'INCREMENT_EVENT',
  key,
});

export const resetAll = (): AppAction => ({ type: 'RESET_ALL' });
