import { CalendarDays, Flame, Settings, Sun, Trophy } from 'lucide-react';
import type { SectionId } from '../../types';
import { SECTIONS } from '../../lib/sections';

const ICONS = {
  sun: Sun,
  flame: Flame,
  trophy: Trophy,
  calendar: CalendarDays,
  settings: Settings,
} as const;

interface NavBarProps {
  active: SectionId;
  onNavigate: (section: SectionId) => void;
}

/** Bottom navigation (top, sticky on wide screens). */
export function NavBar({ active, onNavigate }: NavBarProps) {
  return (
    <nav className="navbar" aria-label="Principal">
      <div className="navbar__inner">
        {SECTIONS.map((section) => {
          const Icon = ICONS[section.icon];
          const isActive = section.id === active;
          return (
            <button
              key={section.id}
              type="button"
              className="nav-item"
              aria-current={isActive ? 'page' : undefined}
              aria-label={section.label}
              onClick={() => onNavigate(section.id)}
            >
              <Icon size={22} aria-hidden="true" strokeWidth={isActive ? 2.4 : 2} />
              <span>{section.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
