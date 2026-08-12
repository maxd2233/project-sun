import { motion } from 'motion/react';
import { Flame } from 'lucide-react';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

interface StreakFlameProps {
  /** Current streak (days). */
  streak: number;
  /** True while the completion celebration runs (the flame dances). */
  celebrating?: boolean;
  variant?: 'sm' | 'lg';
  className?: string;
}

/**
 * The streak, presented as living progress rather than a number in a
 * grid: a small flame that counts up as it grows and dances on the
 * celebration beat.
 */
export function StreakFlame({
  streak,
  celebrating = false,
  variant = 'sm',
  className = '',
}: StreakFlameProps) {
  const reduceMotion = usePrefersReducedMotion();
  const shown = useAnimatedNumber(streak);

  return (
    <div
      className={`streak-flame streak-flame--${variant}${
        celebrating ? ' streak-flame--celebrating' : ''
      }${className ? ` ${className}` : ''}`}
    >
      <motion.span
        className="streak-flame__icon"
        role="img"
        aria-label="Días seguidos"
        animate={
          reduceMotion
            ? undefined
            : celebrating
              ? { scale: [1, 1.28, 0.95, 1.12, 1], rotate: [0, 14, -10, 6, 0] }
              : streak > 0
                ? { y: [0, -1.5, 0] }
                : { opacity: 0.5 }
        }
        transition={
          celebrating
            ? { duration: 0.9, ease: 'easeInOut' }
            : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <Flame strokeWidth={2.4} />
      </motion.span>

      <span className="streak-flame__count" aria-hidden="true">
        {shown}
      </span>
      <span className="streak-flame__unit" aria-hidden="true">
        {streak === 1 ? 'DÍA' : 'DÍAS'}
      </span>
      <span className="visually-hidden">
        Racha actual: {streak} {streak === 1 ? 'día' : 'días'}
      </span>
    </div>
  );
}