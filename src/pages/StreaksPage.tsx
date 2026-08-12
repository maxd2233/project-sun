import { AppHeader } from '../components/layout/AppHeader';
import { StatsSummary } from '../features/stats/StatsSummary';
import { CompanionPanel } from '../features/companion/CompanionPanel';

/** Stats: derived history analytics + Solín, the virtual companion. */
export function StreaksPage() {
  return (
    <div className="page">
      <AppHeader title="Estadísticas" subtitle="Tu constancia, en números." />
      <StatsSummary />
      <CompanionPanel />
    </div>
  );
}
