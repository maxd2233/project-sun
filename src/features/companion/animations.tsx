import { useMemo } from 'react';
import { motion } from 'motion/react';
import { randomRange } from '../../lib/random';
import { COMPANION_EASE } from './presets';

/**
 * Companion effect components. Every burst is keyed by `token`: bump the
 * token to replay it. Particles animate to opacity 0 and are kept mounted
 * until the parent clears them, so repeated taps always feel fresh.
 */

export interface BurstProps {
  /** Increment to replay the burst. */
  token: number;
  reduceMotion: boolean;
}

const CELEBRATION_COLORS = ['#fbbf24', '#f59e0b', '#fb923c', '#fde68a', '#ffffff'];

/** Colored dots exploding outward (mission complete). */
export function CelebrationBurst({ token, reduceMotion }: BurstProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 12 + randomRange(-0.2, 0.2);
        const distance = randomRange(46, 84);
        return {
          angle,
          distance,
          size: randomRange(6, 11),
          color: CELEBRATION_COLORS[i % CELEBRATION_COLORS.length],
          delay: randomRange(0, 0.06),
        };
      }),
    // Rebuild once per burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token],
  );

  if (token === 0 || reduceMotion) return null;

  return (
    <div className="companion__bursts" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.span
          key={`${token}-${i}`}
          className="companion__burst companion__burst--dot"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: [0, 1, 1, 0],
            scale: 1,
          }}
          transition={{ duration: 0.95, delay: p.delay, ease: COMPANION_EASE }}
          style={{ width: p.size, height: p.size, background: p.color }}
        />
      ))}
    </div>
  );
}

/** Golden stars popping around Solín (achievement unlocked). */
export function AchievementBurst({ token, reduceMotion }: BurstProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 8 + randomRange(-0.3, 0.3);
        return {
          angle,
          distance: randomRange(30, 60),
          size: randomRange(12, 18),
          glyph: i % 2 === 0 ? '✦' : '✧',
          delay: randomRange(0, 0.08),
        };
      }),
    // Rebuild once per burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token],
  );

  if (token === 0 || reduceMotion) return null;

  return (
    <div className="companion__bursts" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.span
          key={`${token}-${i}`}
          className="companion__burst companion__burst--star"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.2, rotate: -40 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: [0, 1, 1, 0],
            scale: [0.2, 1.15, 1],
            rotate: 25,
          }}
          transition={{ duration: 1.05, delay: p.delay, ease: COMPANION_EASE }}
          style={{ fontSize: p.size }}
        />
      ))}
    </div>
  );
}

/** Tiny hearts on poke. */
export function PokeBurst({ token, reduceMotion }: BurstProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 4 + randomRange(-0.35, 0.35);
        return {
          angle,
          distance: randomRange(18, 34),
          size: randomRange(11, 15),
          delay: randomRange(0, 0.04),
        };
      }),
    // Rebuild once per burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token],
  );

  if (token === 0 || reduceMotion) return null;

  return (
    <div className="companion__bursts" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.span
          key={`${token}-${i}`}
          className="companion__burst companion__burst--heart"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance - 8,
            opacity: [0, 1, 1, 0],
            scale: 1,
          }}
          transition={{ duration: 0.8, delay: p.delay, ease: COMPANION_EASE }}
          style={{ fontSize: p.size }}
        >
          ♥
        </motion.span>
      ))}
    </div>
  );
}
