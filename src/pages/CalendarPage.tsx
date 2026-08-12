import { AppHeader } from '../components/layout/AppHeader';
import { CalendarView } from '../features/calendar/CalendarView';

/** Calendar: month grid of completed missions with day detail. */
export function CalendarPage() {
  return (
    <div className="page">
      <AppHeader title="Calendario" subtitle="Cada día cumplido, de un vistazo." />
      <CalendarView />
    </div>
  );
}
