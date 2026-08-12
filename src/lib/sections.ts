import type { SectionDefinition, SectionId } from '../types';

/**
 * Registry of top-level sections. Adding a new tab is a single entry here;
 * the router and nav render from this list.
 */
export const SECTIONS: SectionDefinition[] = [
  { id: 'today', label: 'Hoy', icon: 'sun', title: 'Daily Mission' },
  { id: 'streaks', label: 'Racha', icon: 'flame', title: 'Estadísticas' },
  { id: 'achievements', label: 'Logros', icon: 'trophy', title: 'Logros' },
  { id: 'calendar', label: 'Calendario', icon: 'calendar', title: 'Calendario' },
  { id: 'settings', label: 'Ajustes', icon: 'settings', title: 'Ajustes' },
];

export const DEFAULT_SECTION: SectionId = 'today';
