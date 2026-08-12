import { useNow } from '../../hooks/useNow';
import { formatDateLong, formatTime } from '../../lib/date';

interface LiveClockProps {
  className?: string;
}

/**
 * Self-contained live clock. Ticks on its own internal 1s interval so the
 * rest of the tree is never re-rendered while it runs. Time and date are
 * formatted locally for presentation only.
 */
export function LiveClock({ className = '' }: LiveClockProps) {
  const now = useNow(1000);

  return (
    <div className={`home-clock${className ? ` ${className}` : ''}`}>
      <span className="home-clock__time" aria-label={`Hora actual: ${formatTime(now)}`}>
        {formatTime(now)}
      </span>
      <span className="home-clock__date">{formatDateLong(now)}</span>
    </div>
  );
}
