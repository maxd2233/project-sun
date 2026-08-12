import { useCallback, useMemo, useState, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppStateProvider } from './store/AppStateContext';
import { incrementEvent } from './store/actions';
import { useAppState } from './store/context';
import { useThemeSync } from './hooks/useTheme';
import { usePrefersReducedMotion } from './hooks/useMediaQuery';
import { AppShell } from './components/layout/AppShell';
import { NavBar } from './components/layout/NavBar';
import { HomePage } from './pages/HomePage';
import { StreaksPage } from './pages/StreaksPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { AchievementUnlockHost } from './features/achievements/AchievementUnlockHost';
import { ACHIEVEMENT_EVENTS } from './config/achievements';
import { DEFAULT_SECTION } from './lib/sections';
import type { SectionId } from './types';

const PAGES: Record<Exclude<SectionId, 'today'>, ComponentType> = {
  streaks: StreaksPage,
  achievements: AchievementsPage,
  calendar: CalendarPage,
  settings: SettingsPage,
};

function App() {
  const [section, setSection] = useState<SectionId>(DEFAULT_SECTION);
  const { dispatch } = useAppState();
  const reduceMotion = usePrefersReducedMotion();
  useThemeSync();

  // Centralised navigation. Visiting the Logros screen is a real app event
  // counted for the achievements that depend on it (e.g. "El pato te observa").
  const navigate = useCallback(
    (next: SectionId) => {
      if (next === 'achievements') {
        dispatch(incrementEvent(ACHIEVEMENT_EVENTS.achievementsPageViews));
      }
      setSection(next);
    },
    [dispatch],
  );

  const TodayPage = useMemo(() => () => <HomePage />, []);
  const Page = section === 'today' ? TodayPage : PAGES[section];

  return (
    <>
      <AppShell wide={section === 'today'}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={section}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Page />
          </motion.div>
        </AnimatePresence>
      </AppShell>
      <NavBar active={section} onNavigate={navigate} />
    </>
  );
}

export default function Root() {
  return (
    <AppStateProvider>
      <App />
      <AchievementUnlockHost />
    </AppStateProvider>
  );
}
