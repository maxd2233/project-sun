import { createContext, useContext, type Dispatch } from 'react';
import type { AppState, DateKey, DailyRecord } from '../types';
import type { AppAction } from './actions';

export interface AppStateContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  todayKey: DateKey;
  todayRecord: DailyRecord | undefined;
  isTodayCompleted: boolean;
}

export const AppStateContext = createContext<AppStateContextValue | null>(null);

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within <AppStateProvider>');
  }
  return ctx;
}
