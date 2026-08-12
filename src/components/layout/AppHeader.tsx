import type { ReactNode } from 'react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/** Sticky-friendly page header with an optional action slot. */
export function AppHeader({ title, subtitle, action }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <h1 className="app-header__title">{title}</h1>
        {subtitle ? <p className="app-header__sub">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
