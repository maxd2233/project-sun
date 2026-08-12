import type { ReactNode } from 'react';

interface StatProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

/** Label + value pair used across dashboard grids. */
export function Stat({ label, value, accent = false }: StatProps) {
  return (
    <div className="stat">
      <span
        className={`stat__value${accent ? ' stat__value--accent' : ''}`}
        aria-label={label}
      >
        {value}
      </span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

interface StatRowProps {
  children: ReactNode;
}

export function StatRow({ children }: StatRowProps) {
  return <div className="stat-row">{children}</div>;
}
