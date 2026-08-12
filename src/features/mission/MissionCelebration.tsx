import { motion } from 'motion/react';
import { COMPLETE_LABEL } from '../../config/messages';

/** Draws a circular check via SVG pathLength animation. */
function CelebrationCheck({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" fill="none" aria-hidden="true">
      <motion.circle
        cx="42"
        cy="42"
        r="38"
        stroke="var(--success)"
        strokeWidth="6"
        initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <motion.path
        d="M26 43 L37 54 L58 31"
        stroke="var(--success)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 0.35,
          delay: reduceMotion ? 0 : 0.32,
          ease: 'easeOut',
        }}
      />
    </svg>
  );
}

interface MissionCelebrationProps {
  xpEarned: number;
  message: string;
  reduceMotion: boolean;
}

/**
 * The completion sequence shown right after pressing the button:
 * check draws in, XP pops, a random message slides in, then the state
 * settles on "MISSION COMPLETE".
 */
export function MissionCelebration({
  xpEarned,
  message,
  reduceMotion,
}: MissionCelebrationProps) {
  const base = reduceMotion
    ? { initial: false, transition: {} }
    : { initial: { opacity: 0 }, transition: { delay: 0 } };

  return (
    <div className="celebration">
      <motion.div
        {...base}
        animate={{ opacity: 1, scale: [0.8, 1.06, 1] }}
        transition={reduceMotion ? { duration: 0.01 } : { duration: 0.5, ease: 'easeOut' }}
      >
        <CelebrationCheck reduceMotion={reduceMotion} />
      </motion.div>

      <motion.p
        className="celebration__title"
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.01 } : { delay: 0.45, duration: 0.3 }}
      >
        {COMPLETE_LABEL}
      </motion.p>

      <motion.p
        className="celebration__xp"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduceMotion ? { duration: 0.01 } : { delay: 0.6, type: 'spring', stiffness: 300, damping: 14 }}
      >
        +{xpEarned} XP
      </motion.p>

      <motion.p
        className="celebration__message"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.01 } : { delay: 0.78, duration: 0.4, ease: 'easeOut' }}
      >
        {message}
      </motion.p>
    </div>
  );
}
