import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  interactive?: boolean;
}

/** Surface container used for every section of the UI. */
export function Card({
  children,
  title,
  interactive = false,
  className = '',
  ...rest
}: CardProps) {
  const classes = [
    'card',
    interactive ? 'card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes} {...rest}>
      {title ? <h2 className="card__title">{title}</h2> : null}
      {children}
    </section>
  );
}
