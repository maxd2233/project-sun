import { motion } from 'motion/react';
import { BarChart3, CalendarDays, Settings, Trophy } from 'lucide-react';
import type { SectionId } from '../../types';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

const ACTIONS: Array<{
  id: SectionId;
  label: string;
  description: string;
  icon: typeof BarChart3;
}> = [
  { id: 'streaks', label: 'Estadísticas', description: 'Rachas y totales', icon: BarChart3 },
  { id: 'calendar', label: 'Calendario', description: 'Tu historial', icon: CalendarDays },
  { id: 'achievements', label: 'Logros', description: 'Insignias ganadas', icon: Trophy },
  { id: 'settings', label: 'Configuración', description: 'Ajustes', icon: Settings },
];

interface QuickActionsProps {
  onNavigate: (section: SectionId) => void;
}

/** Grid of shortcuts to the other sections. */
export function QuickActions({ onNavigate }: QuickActionsProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section aria-label="Atajos">
      <div className="quick-grid">
        {ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              type="button"
              className="quick-tile"
              onClick={() => onNavigate(action.id)}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.08 * index, duration: 0.3, ease: 'easeOut' }}
            >
              <span className="quick-tile__icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="quick-tile__label">{action.label}</span>
              <span className="quick-tile__desc">{action.description}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
