import { AppHeader } from '../components/layout/AppHeader';
import { AchievementGrid } from '../features/achievements/AchievementGrid';

/** Achievements: badges earned through streaks, days and XP. */
export function AchievementsPage() {
  return (
    <div className="page">
      <AppHeader title="Logros" subtitle="Insignias que se ganan con constancia." />
      <AchievementGrid />
    </div>
  );
}
