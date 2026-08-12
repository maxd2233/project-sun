import { useEffect, useReducer, type ReactNode } from 'react';
import { appReducer } from './reducer';
import { loadState, saveState } from '../services/persistence';
import { STORAGE_KEYS } from '../lib/storage';
import { isCompleted } from '../services/records';
import { useTodayKey } from '../hooks/useNow';
import { AppStateContext } from './context';
import { buildSeededState, parseSeedParam } from '../lib/seed';

/**
 * Initial state. Reading `?seed=N` seeds `N` completed days (ending
 * yesterday) ONLY when there is no data yet — real progress is never
 * overwritten. This powers the "day 2" demo without touching real data.
 */
function getInitialState() {
  const persisted = loadState();
  const seedDays = parseSeedParam();
  if (seedDays !== null && Object.keys(persisted.records).length === 0) {
    return buildSeededState(seedDays);
  }
  return persisted;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);

  // "Today" is derived live and only changes when the calendar day rolls
  // over (midnight / month / year / device timezone change). The provider
  // re-renders at most once per day instead of on every clock tick.
  const todayKey = useTodayKey(30_000);
  const todayRecord = state.records[todayKey];
  const isTodayCompleted = isCompleted(todayRecord);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.appState && event.newValue) {
        try {
          dispatch({ type: 'HYDRATE', state: loadState() });
        } catch {
          /* ignore malformed cross-tab writes */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        state,
        dispatch,
        todayKey,
        todayRecord,
        isTodayCompleted,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}
