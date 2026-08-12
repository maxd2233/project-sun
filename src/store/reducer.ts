import type { AppState, DateKey, DailyRecord } from '../types';
import { createDefaultState, recomputeProgress } from '../services/persistence';
import { xpForCompletion } from '../services/xp';
import { countStreakEndingAt } from '../services/streaks';
import { isCompleted, isDuplicateEntry } from '../services/records';
import type { AppAction } from './actions';

/**
 * Pure reducer. `COMPLETE_TODAY` is idempotent: if the day is already
 * recorded as completed it returns the same state, so records can never
 * be duplicated. Aggregate progress is always recomputed from records and
 * achievements unlock automatically whenever their conditions are met.
 */
function withProgress(state: AppState): AppState {
  return {
    ...state,
    progress: recomputeProgress(state.records, state.progress, {
      mission: state.mission,
      events: state.events,
    }),
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;

    case 'COMPLETE_TODAY': {
      // Duplicate detection: a day can never be recorded twice. If a
      // record already exists we return the exact same state reference,
      // so the first timestamp is preserved and never overwritten.
      if (isDuplicateEntry(state.records, action.date)) return state;

      const withDay = {
        ...state.records,
        [action.date]: {
          date: action.date,
          completed: true,
          completedAt: action.completedAt,
          xpEarned: 0,
        },
      };

      const streakAfter = countStreakEndingAt(withDay, action.date);
      withDay[action.date] = {
        ...withDay[action.date],
        xpEarned: xpForCompletion(streakAfter),
      };

      return withProgress({
        ...state,
        records: withDay,
      });
    }

    case 'UNDO_TODAY': {
      if (!isCompleted(state.records[action.date])) return state;
      const rest: Record<DateKey, DailyRecord> = {};
      for (const [key, record] of Object.entries(state.records)) {
        if (key !== action.date) rest[key] = record;
      }
      return withProgress({
        ...state,
        records: rest,
      });
    }

    case 'UPDATE_MISSION':
      return withProgress({
        ...state,
        mission: {
          ...state.mission,
          ...action.mission,
          scheduledTime: action.mission.scheduledTime ?? state.mission.scheduledTime,
        },
      });

    case 'INCREMENT_EVENT':
      return withProgress({
        ...state,
        events: {
          ...state.events,
          [action.key]: (state.events[action.key] ?? 0) + 1,
        },
      });

    case 'SET_THEME':
      return {
        ...state,
        settings: { ...state.settings, theme: action.theme },
      };

    case 'SET_USER_NAME':
      return {
        ...state,
        settings: { ...state.settings, userName: action.userName },
      };

    case 'REGISTER_COMPANION_VISIT':
      return {
        ...state,
        companion: {
          visits: state.companion.visits + 1,
          lastVisitedAt: action.visitedAt,
        },
      };

    case 'RESET_ALL':
      return createDefaultState();

    default:
      return state;
  }
}
