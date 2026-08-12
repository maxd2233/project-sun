import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  /** Use a wider content column (e.g. the two-column home). */
  wide?: boolean;
}

/** Wraps page content with padding for the fixed bottom nav. */
export function AppShell({ children, wide = false }: AppShellProps) {
  return (
    <div className={`app-shell${wide ? ' app-shell--wide' : ''}`}>
      <main>{children}</main>
    </div>
  );
}
