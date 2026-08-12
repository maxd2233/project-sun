import type { ReactNode } from 'react';

interface ProgressRingProps {
  /** 0..100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  children?: ReactNode;
}

/** Circular progress indicator with centered content. */
export function ProgressRing({
  value,
  size = 160,
  strokeWidth = 12,
  label,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div
      className="ring"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg width={size} height={size} aria-hidden="true">
        <circle
          className="ring__track"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        <circle
          className="ring__value"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="ring__content">{children}</div>
    </div>
  );
}
