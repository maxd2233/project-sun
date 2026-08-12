import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Placeholder used for sections that are planned but not yet built. */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="empty">
      <Icon className="empty__icon" aria-hidden="true" />
      <p className="empty__title">{title}</p>
      <p className="empty__desc">{description}</p>
    </div>
  );
}
